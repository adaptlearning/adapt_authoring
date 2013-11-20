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
    express = require('express');

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

// wrap express/connect routing methods
['get', 'post', 'put', 'delete', 'head'].forEach(function (method) {
  AdaptBuilder.prototype[method] = function () {
    this.server[method].apply(this.server, arguments);
  };
});

AdaptBuilder.prototype.use = function(opts) {
  this.options = _.extend(this.options, opts);
};

AdaptBuilder.prototype.preloadModule = function (module) {
  if (module.preload && 'function' === typeof module.preload) {
    module.preload(this);
  }
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
      server.use(express.cookieParser());
      server.use(express.bodyParser());
      server.use(express.methodOverride());
      server.use(express.cookieSession( { secret: sessionSecret, store: sessionStore } ));
      server.use(auth.initialize());
      server.use(auth.session());
      server.use(express.static(path.join(app.configuration.serverRoot, 'public')));
      server.use(require('./permissions').policyChecker());
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
    app.emit("serverStarted", server);
  });

  // load core subsystems
  this.server = express();
  this.preloadModule(require('./configuration'));
  this.preloadModule(require('./logger'));
  this.preloadModule(require('./filestorage'));
  this.preloadModule(require('./pluginmanager'));
  this.preloadModule(require('./database'));
  this.preloadModule(auth);
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
