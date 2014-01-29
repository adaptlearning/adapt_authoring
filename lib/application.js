/**
 * Module depencies
 */

var EventEmitter = require('events').EventEmitter,
    pluginmanager = require('./pluginmanager'),
    auth = require('./auth'),
    util = require('util'),
    path = require('path'),
    _ = require('underscore'),
    database = require('./database'),
    express = require('express'),
    domain = require('domain'),
    permissions = require('./permissions');

/**
 * The application class
 * @constructor
 */

function AdaptBuilder() {
  this.options = {
    configFile: path.join('conf', 'config.json')
  };

  var awaitingLoad = [];
  var that = this;
  this.moduleReady = function (moduleName) {
    var index = awaitingLoad.indexOf(moduleName);
    if (-1 !== index) {
      awaitingLoad.splice(index, 1);
    }

    if (0 === awaitingLoad.length) {
      that.emit('modulesReady', that);
    }
  };

  this.waitForModule = function (module, moduleName) {
    // must implement 'once'
    if (!module || !module.once || 'function' !== typeof module.once) {
      throw new Error('module does not inherit from EventEmitter!', module);
    }

    // moduleName should be unique!
    if (-1 === awaitingLoad.indexOf(moduleName)) {
      module.once('moduleReady', this.moduleReady);
      awaitingLoad.push(moduleName);
    }
  };
}

// inherits EventEmitter
util.inherits(AdaptBuilder, EventEmitter);

// module load constants
AdaptBuilder.prototype.preloadConstants = {
  UNCALLED : 0, //Module preload not called
  WAITING : 1, //Module preload called, module waiting on another module loading
  LOADING : 2, //Module preload is running
  FAILED : 3, //Module preload failed
  COMPLETE : 4 //Module preload complete
};

// wrap express/connect routing methods
['get', 'post', 'put', 'delete', 'head'].forEach(function (method) {
  AdaptBuilder.prototype[method] = function () {
    this.server[method].apply(this.server, arguments);
  };
});

AdaptBuilder.prototype.use = function(opts) {
  this.options = _.extend(this.options, opts);
};

AdaptBuilder.prototype._preloadModules = [];

AdaptBuilder.prototype.preloadModule = function (name, module) {

  //special case function that indicates the module has no dependencies
  //and can be loaded directly
  if('function' === typeof module.init){
    module.init(this);
    return true;
  }


  if (module.preload && 'function' === typeof module.preload) {
    //this._preloadModules.push(module.preload.bind(module));
    this._preloadModules.push({
      moduleName : name,
      module : module,
      readyState : this.preloadConstants.UNCALLED,
      response : false,
    });

    module.preload(this).on('preloadChange',this.modulePreloadEventHandler.bind(this));
  }
};

AdaptBuilder.prototype.modulePreloadEventHandler = function (name, status, response) {

  //locate the module record
  this._preloadModules.some(function(mod){

    if(name === mod.moduleName){

      if('undefined' === typeof response){
        response = false;
      }

      mod.readyState = status;
      mod.response = response

      switch (status) {
        case this.preloadConstants.COMPLETE :
          this.emit('moduleLoaded', name);
          break;
        case this.preloadConstants.FAILED :
          this.emit('moduleFailed', name, response);
          break;
        default :
          break;
      }

      return true;
    }

    return false;
  }, this);
}

/**
 * Preload function to trigger startup loading of modules
 * Adds listeners to itself for module load/fail
 * and emits the initiate event modulesPreload
 */
AdaptBuilder.prototype.preload = function(){

  var self = this;

  self.on('moduleLoaded',function(){
    var modError = false;
    var modWait = false;

    self._preloadModules.some(function(mod){
      if(mod.readyState === self.preloadConstants.FAILED){
        modError = true;
        return true;
      }else if(mod.readyState !== self.preloadConstants.COMPLETE){
        //module is working/waiting
        modWait = true;
      }
      return false;
    });

    if(false === modError && false === modWait){
      //everything is loaded
      self.emit('preloadComplete');
      return true;
    }

  });

  self.once('moduleFailed', function(modName, err){
    console.log('PRELOAD ERROR: ' + modName + ' - ' + err.toString());
    process.exit(1);
  });

  self.on('preloadComplete',function(){
    self.emit('modulesReady',self);
  });

  self.emit('modulesPreload');
};

/**
 * middleware to handle generic errors that we want to send to the client
 *
 * @return {function} - the middleware function
 */
AdaptBuilder.prototype.clientErrorHandler = function () {
  return function (err, req, res, next) {
    res.statusCode = err.statusCode || 500;
    res.json(err);
    res.end();
  };
};

/**
 *
 * @api public
 */

AdaptBuilder.prototype.start = function() {
  // some modules are loaded async, so wait for them before actually starting the server
  this.once('modulesReady', function (app) {
    // configure server
    var server = app.server;
    var sessionSecret = app.configuration.getConfig('sessionSecret');
    var sessionStore = app.db.getSessionStore();
    server.configure(function () {
      server.set('view engine', app.configuration.getConfig('viewEngine'));
      server.set('views', path.join(app.configuration.serverRoot, app.configuration.getConfig('viewPath')));
      server.use(express.cookieParser());
      server.use(express.json());
      server.use(express.urlencoded());
      server.use(express.methodOverride());
      server.use(express.cookieSession( { secret: sessionSecret, store: sessionStore } ));
      server.use(function (req, res, next) {
        var requestDomain = domain.create();
        requestDomain.add(req);
        requestDomain.add(res);
        requestDomain.session = req.session;
        requestDomain.on('error', next);
        requestDomain.run(next);
      });
      server.use(auth.initialize());
      server.use(auth.session());
      server.use(express.static(path.join(app.configuration.serverRoot, app.configuration.getConfig('frontend'), 'build')));
      server.use(permissions.policyChecker());
      server.use(server.router);
      // server.use(app.clientErrorHandler());
    });

    server.configure('development', function () {
      server.use(express.errorHandler({
          dumpExceptions: true,
          showStack: true
        }));
    });

    server.configure('production', function () {
      server.use(express.errorHandler());
    });

    // start server
    server.listen(app.configuration.getConfig('serverPort'));
    console.log('Server Started ' + app.configuration.getConfig('serverPort'));

    // add / route
    app.get('/', function (req, res, next) {
      res.render('index');
    });

    app.emit("serverStarted", server);

    permissions.ignoreRoute('api/login');

  });

  // load core subsystems
  this.server = express();
  this.preloadModule('configuration', require('./configuration'));
  this.preloadModule('database', require('./database'));
  this.preloadModule('logger', require('./logger'));
  this.preloadModule('rest', require('./rest'));
  this.preloadModule('filestorage', require('./filestorage'));
  this.preloadModule('pluginmanager', require('./pluginmanager'));
  this.preloadModule('contentmanager', require('./contentmanager'));
  this.preloadModule('assetmanager', require('./assetmanager'));
  this.preloadModule('authentication', auth);
  this.preloadModule('usermanager', require('./usermanager'));
  this.preload();
};

/**
 * returns the url for the currently running server
 *
 * @return {url}
 */
AdaptBuilder.prototype.getServerURL = function () {
  if (!this._serverURL) {
    // @TODO - fix the scheme
    this._serverURL = 'http://' +
      this.configuration.getConfig('serverName') +
      ':' + this.configuration.getConfig('serverPort');
  }
  return this._serverURL;
};

/**
 * This is a preloader class to be used by modules in the preload process
 *
 * @param {object} app - Adaptbuilder instance @todo get rid of this as requirement
 * @param {string} modname - Name of the module
 * @param {object} options - Object containing the options for this instance
 */
AdaptBuilder.prototype.ModulePreloader = function (app, modname, options) {

  this.options = _.extend(app.ModulePreloader.defOpts, options);

  this.modname = modname;

  if(this.options.events){
    if(this.options.events.preload){
       app.on('modulesPreload', this.options.events.preload.bind(this));
    }
    if(this.options.events.moduleLoaded){
      app.on('moduleLoaded', this.options.events.moduleLoaded.bind(this));
    }
    if(this.options.events.postload){
     app.on('preloadComplete', this.options.events.postload.bind(this));
    }
  }

};

// inherits EventEmitter
util.inherits(AdaptBuilder.prototype.ModulePreloader, EventEmitter);

/**
 * Default options for ModulePreloader instances
 */
AdaptBuilder.prototype.ModulePreloader.defOpts = {
  events : {
    preload:false,
    moduleLoaded:false,
    postload:false //not used yet @todo maybe remove option
  }
};


/**
 * boostraps the adaptbuilder application or returns it if it exists
 *
 * @return (Function)
 */
function createApp() {
  if (!this.app || !this.app instanceof AdaptBuilder) {
    this.app = new AdaptBuilder();
  }

  return this.app;
}

/**
 * Module exports
 */

exports = module.exports = createApp;
