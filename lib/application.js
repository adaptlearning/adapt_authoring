// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
/**
 * Module depencies
 */

var EventEmitter = require('events').EventEmitter,
    pluginmanager = require('./pluginmanager'),
    auth = require('./auth'),
    logger = require('./logger'),
    router = require('./router'),
    util = require('util'),
    path = require('path'),
    _ = require('underscore'),
    database = require('./database'),
    express = require('express'),
    domain = require('domain'),
    exec = require('child_process').exec,
    fs = require('fs'),
    ncp = require('ncp'),
    usermanager = require('./usermanager'),
    permissions = require('./permissions'),
    frameworkhelper = require('./frameworkhelper'),
    async = require('async'),
    polyglot = require('node-polyglot'),
    Mailer = require('./mailer').Mailer,
    configuration = require('./configuration');

var request = require('request');
var async = require('async');
var chalk = require('chalk');

// Express middleware - separated out in express 4
var favicon = require('serve-favicon');
// Could remove this is we decide not to use our own logger class
/*var logger = require('morgan');*/
var methodOverride = require('method-override');
var bodyParser = require('body-parser');
var errorHandler = require('errorhandler');
var compression = require('compression');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var multer  = require('multer');
var session = require('express-session');
// MongoStore needs to be setup after session require
var MongoStore = require('connect-mongo')(session);

// Increase listener ports - defaults to 10
EventEmitter.prototype._maxListeners = 20;

/**
 * Some defaults
 */
var DEFAULT_SERVER_PORT = 5000;

/**
 * Errors
 */

function MissingConfigError (message) {
  this.name = 'MissingConfigError';
  this.message = message || 'Configuration file not found!';
}

util.inherits(MissingConfigError, Error);

/**
 * The application class
 * @constructor
 */

function Origin() {
  this.options = {
    configFile: path.join('conf', 'config.json')
  };

  this.defaults = {
    'DEFAULT_SERVER_PORT': DEFAULT_SERVER_PORT
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
util.inherits(Origin, EventEmitter);

// module load constants
Origin.prototype.preloadConstants = {
  UNCALLED : 0, //Module preload not called
  WAITING : 1, //Module preload called, module waiting on another module loading
  LOADING : 2, //Module preload is running
  FAILED : 3, //Module preload failed
  COMPLETE : 4 //Module preload complete
};

// export errors
Origin.prototype.ERRORS = {
  'MissingConfigError' : MissingConfigError
};

// wrap express/connect routing methods
['get', 'post', 'put', 'patch', 'delete', 'head'].forEach(function (method) {
  Origin.prototype[method] = function () {
    this.server[method].apply(this.server, arguments);
  };
});

Origin.prototype.use = function(opts) {
  this.options = _.extend(this.options, opts);
};

Origin.prototype._preloadModules = [];

Origin.prototype.preloadModule = function (name, module) {

  //special case function that indicates the module has no dependencies
  //and can be loaded directly
  if('function' === typeof module.init) {
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

    module.preload(this).on('preloadChange', this.modulePreloadEventHandler.bind(this));
  }
};

Origin.prototype.modulePreloadEventHandler = function (name, status, response) {
  //locate the module record
  this._preloadModules.some(function (mod) {
    if (name === mod.moduleName) {
      if ('undefined' === typeof response){
        response = false;
      }

      mod.response = response;

      switch (status) {
        case this.preloadConstants.COMPLETE :
          mod.readyState = status;
          this.emit('moduleLoaded', name);
          break;
        case this.preloadConstants.FAILED :
          mod.readyState = status;
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
Origin.prototype.preload = function () {
  var self = this;
  self.on('moduleLoaded', function () {
    var modError = false;
    var modWait = false;

    self._preloadModules.some(function(mod){
      if (mod.readyState === self.preloadConstants.FAILED) {
        modError = true;
        return true;
      } else if (mod.readyState !== self.preloadConstants.COMPLETE) {
        //module is working/waiting
        modWait = true;
      }

      return false;
    });

    if (false === modError && false === modWait) {
      //everything is loaded
      self.emit('preloadComplete');
      return true;
    }

  });

  self.once('moduleFailed', function (modName, err) {
    logger.log('error', 'preload error: ' + modName + ' - ' + err.toString());
    process.exit(1);
  });

  self.on('preloadComplete',function () {
    self.emit('modulesReady',self);
  });

  self.emit('modulesPreload');
};

/**
 * middleware to handle generic errors that we want to send to the client
 *
 * @return {function} - the middleware function
 */
Origin.prototype.clientErrorHandler = function () {
  return function (err, req, res, next) {
    var error = { success: false, error: err.message };
    if (configuration.getConfig('debug')) {
      error.stack = err.stack;
    }
    res.statusCode = err.statusCode || 500;
    return res.json(error);
  };
};

Origin.prototype.createServer = function (options, cb) {
  var server = express();

  // minimal server configuration, used during install
  if (options.minimal) {
    server.use(compression());
    server.use(favicon());
    server.use(morgan('dev'));
    server.use(bodyParser.urlencoded({
      extended: true
    }));
    server.use(bodyParser.json());
    server.use(methodOverride());
    server.use(multer({putSingleFilesInArray: true}));
    server.use(cookieParser());
    server.use(bodyParser.json({limit: '50mb'}));
    server.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
    server.use(express.static(path.join(require('./configuration').serverRoot, 'frontend', 'src')));
    server.use(server.router);

    return cb(null, server);

  }

  // standard server configuration
  var app = this;
  require('./database').getDatabase(function (err, db) {
    if (err) {
      return cb(err);
    }

    // new session store using connect-mongo (issue #544)
    var sessionStore = new MongoStore({
      db: app.configuration.getConfig('dbName'),
      auto_reconnect: true,
      host: app.configuration.getConfig('dbHost'),
      port: app.configuration.getConfig('dbPort'),
      username: app.configuration.getConfig('dbUser'),
      password: app.configuration.getConfig('dbPass')
    });

    server.use(compression());
    /*server.use(favicon());*/
    server.use(bodyParser.urlencoded({
      extended: true
    }));
    server.use(methodOverride());
    server.use(cookieParser());
    server.use(bodyParser.json({limit: '5mb'}));
    server.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
    server.use(session({
      key: 'connect.sid',
      secret: app.configuration.getConfig('sessionSecret'),
      store: sessionStore,
      resave: true,
      cookie: {
        signed: true,
        secureProxy: app.configuration.getConfig('isProduction')
      },
      saveUninitialized: true
    }));

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
    server.use(express.static(path.join(app.configuration.serverRoot, 'frontend', 'src')));
    server.use(permissions.policyChecker());


    /*server.use(server.router);*/

    // loop through the plugins for middleware
    var pluginManager = pluginmanager.getManager();
    var plugins = pluginManager.getPlugins();
    var plugin;
    Object.keys(plugins).forEach(function(directory){
      Object.keys(plugins[directory]).forEach(function(name){
        try {
          var Plugin = require(plugins[directory][name].fullPath);
          plugin = new Plugin();
          if ('function' == typeof plugin.getMiddleware){
            plugin.getMiddleware(server,function(callback){
              callback();
            });
          }
        } catch (err) {
          logger.log('fatal', 'error getting plugin middleware', err);
        }
      });
    });

    server.use(app.clientErrorHandler());


    /*if ('development' == server.get('env')) {
      server.use(errorHandler({
        dumpExceptions: false,
        showStack: false
      }));
    }*/

    return cb(null, server);
  }, configuration.getConfig('dbName'));
};

Origin.prototype.startServer = function (options) {

  // Ensure that the options object is set.
  options = typeof options === 'undefined'
    ? { skipVersionCheck: false, skipStartLog: false}
    : options;

  // configure server
  var serverOptions = {};
  if (!this.configuration || !this.configuration.getConfig('dbName')) {
    serverOptions.minimal = true;
  }

  var app = this;

  var installedBuilderVersion = '', installedFrameworkVersion = '';
  var latestBuilderTag = '';
  var latestFrameworkTag = '';

  async.series([
    function(callback) {
      // Read the current versions
      var versionFile = JSON.parse(fs.readFileSync('version.json'), {encoding: 'utf8'});

      if (versionFile) {
        installedBuilderVersion = versionFile.adapt_authoring;
        installedFrameworkVersion = versionFile.adapt_framework;
      }

      callback();
    },
    function(callback) {
      if (true === configuration.getConfig('isTestEnvironment') || options.skipVersionCheck) {
        return callback();
      }

      // Check the latest version of the project
      request({
        headers: {
          'User-Agent' : 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.118 Safari/537.36'
        },
        uri: 'https://api.github.com/repos/adaptlearning/adapt_authoring/tags',
        method: 'GET'
      }, function (error, response, body) {
        if (error) {
          logger.log('error', error);
        } else if (response.statusCode == 200) {
            var tagInfo = JSON.parse(body);

            if (tagInfo) {
              latestBuilderTag = tagInfo[0].name;
            }
         }

         callback();
      });
    },
    function(callback) {
      if (true === configuration.getConfig('isTestEnvironment') || options.skipVersionCheck) {
        return callback();
      }

      // Check the latest version of the framework
      request({
        headers: {
          'User-Agent' : 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.118 Safari/537.36'
        },
        uri: 'https://api.github.com/repos/adaptlearning/adapt_framework/tags',
        method: 'GET'
      }, function (error, response, body) {
        if (error) {
          logger.log('error', error);
        } else if (response.statusCode == 200) {
            var tagInfo = JSON.parse(body);

            if (tagInfo) {
              latestFrameworkTag = tagInfo[0].name;
            }
        }

         callback();
      });
    },
    function(callback) {
      if (true === configuration.getConfig('isTestEnvironment') || options.skipVersionCheck) {
        return callback();
      }

      var isUpdateAvailable = false;

      if (installedBuilderVersion == latestBuilderTag) {
        logger.log('info', chalk.green('%s %s'), app.polyglot.t('app.productname'), installedBuilderVersion);
      } else {
        logger.log('info', chalk.yellow('You are currently running %s %s - %s is now available'), app.polyglot.t('app.productname'), installedBuilderVersion, latestBuilderTag);
        isUpdateAvailable = true;
      }

      if (installedFrameworkVersion == latestFrameworkTag) {
        logger.log('info', chalk.green('Adapt Framework %s'), installedFrameworkVersion);
      } else {
        logger.log('info', chalk.yellow('The Adapt Framework being used is %s - %s is now available'), installedFrameworkVersion, latestFrameworkTag);
        isUpdateAvailable = true;
      }

      if (isUpdateAvailable) {
        logger.log('info', "Run " + chalk.bgRed('"node upgrade.js"') + " to update to the latest version");
      }

      callback();
    },
    function(callback) {
      app.createServer(serverOptions, function (error, server) {
        if (error) {
          logger.log('fatal', 'error creating server', error);
          return process.exit(1);
        }

        // use default port if configuration is not available
        var port = app.configuration
          ? app.configuration.getConfig('serverPort')
          : DEFAULT_SERVER_PORT;

        app.server = server;

        //  Create a http server
        var httpServer = require('http').createServer(server);

        app._httpServer = httpServer.listen(port, function(){
            // set up routes
          app.router = router(app);

          // handle different server states
          if (serverOptions.minimal) {
            app.emit("minimalServerStarted", app.server);
          } else {
            app.emit("serverStarted", app.server);
          }

          var writeRebuildFile = function(courseFolder, callback) {
            var OutputConstants = require('./outputmanager').Constants;
            var buildFolder = path.join(courseFolder, OutputConstants.Folders.Build);

            fs.exists(buildFolder, function (exists) {
              if (exists) {
                // Write an empty lock file called .rebuild
                logger.log('info', 'Writing build to ' + path.join(buildFolder, OutputConstants.Filenames.Rebuild));
                fs.writeFile(path.join(buildFolder, OutputConstants.Filenames.Rebuild), '', function (err) {
                  if (err) {
                    return callback(err);
                  }

                  return callback(null);
                });
              } else {
                return callback(null);
              }
            });
          };

          app.on("rebuildCourse", function(tenantId, courseId) {
            logger.log('info', 'Event:rebuildCourse triggered for Tenant: ' + tenantId + ' Course: ' + courseId);
            // Not ideal, but there is a timing issue which prevente d
            var OutputConstants = require('./outputmanager').Constants;
            var courseFolder = path.join(configuration.tempDir, configuration.getConfig('masterTenantID'), OutputConstants.Folders.Framework, OutputConstants.Folders.AllCourses, tenantId, courseId);

            fs.exists(courseFolder, function(exists) {
              if (exists) {
                writeRebuildFile(courseFolder, function(err) {
                  if (err) {
                    logger.log('error', err);
                  }

                  return;
                });
              }

              return;
            });
          });

          if (!options.skipStartLog) {
            logger.log('info', 'Server started listening on port ' + port);
          }

          callback();
        });
      });
    }
  ]);


};

Origin.prototype.restartServer = function () {
  var app = this;
  if (app._httpServer) {
    logger.log('info', 'shutting down server ...');
    try {
      // @TODO - if a connection is made before the 'close' event
      // fires, close never seems to get called. Need to find a way
      // to disalllow connection attempts during restart
      // app._httpServer.maxConnections = 0;
      // app._httpServer.unref();
      app._httpServer.close();
      app._httpServer.once('close', function () {
        logger.log('info', 'restarting server ...');
        app.startServer();
      });
    } catch (error) {
      logger.log('error', error);
    }
  }
};

/**
 *
 * @api public
 */

Origin.prototype.run = function (options) {
  // some modules are loaded async, so wait for them before actually starting the server
  this.once('modulesReady', function (app) {
    try {
      // Initialise the Polglot module so we can access language strings from the JSON
      var phraseStrings = JSON.parse(fs.readFileSync(path.join(configuration.serverRoot, 'routes', 'lang', 'en.json'), {encoding: 'utf8'}));
      app.polyglot = new polyglot({phrases: phraseStrings});
    } catch (e) {
      logger.log('debug', 'Failed to load language strings.', e);
      app.polyglot = new polyglot();
    }
    app.mailer = new Mailer();

    app.startServer(options);
  });


  // load core subsystems
  this.preloadModule('configuration', require('./configuration'));
  this.preloadModule('database', require('./database'));
  this.preloadModule('logger', require('./logger'));
  this.preloadModule('rest', require('./rest'));
  this.preloadModule('pluginmanager', require('./pluginmanager'));
  this.preloadModule('filestorage', require('./filestorage'));
  this.preloadModule('contentmanager', require('./contentmanager'));
  this.preloadModule('assetmanager', require('./assetmanager'));
  this.preloadModule('outputmanager', require('./outputmanager'));
  this.preloadModule('authentication', auth);
  this.preloadModule('usermanager', require('./usermanager'));
  this.preloadModule('tenantmanager', require('./tenantmanager'));
  this.preloadModule('rolemanager', require('./rolemanager'));
  this.preloadModule('bowermanager', require('./bowermanager'));
  this.preload();
};

/**
 * returns the url for the currently running server
 *
 * @return {url}
 */
Origin.prototype.getServerURL = function () {
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
 * @param {object} app - Origin instance @todo get rid of this as requirement
 * @param {string} modname - Name of the module
 * @param {object} options - Object containing the options for this instance
 */
Origin.prototype.ModulePreloader = function (app, modname, options) {

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
util.inherits(Origin.prototype.ModulePreloader, EventEmitter);

/**
 * Default options for ModulePreloader instances
 */
Origin.prototype.ModulePreloader.defOpts = {
  events : {
    preload:false,
    moduleLoaded:false,
    postload:false //not used yet @todo maybe remove option
  }
};


/**
 * boostraps the application or returns it if it exists
 *
 * @return (Function)
 */
function createApp() {
  if (!this.app || !this.app instanceof Origin) {
    this.app = new Origin();
  }

  return this.app;
}

/**
 * Module exports
 */

exports = module.exports = createApp;
