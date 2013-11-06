/**
 * Module depencies
 */

var EventEmitter = require('events').EventEmitter,
    pluginmanager = require('./pluginmanager'),
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

AdaptBuilder.prototype.use = function(opts) {
  this.options = _.extend(this.options, opts);
};

/**
 *
 * @api public
 */

AdaptBuilder.prototype.start = function() {
  // some modules are loaded async, so wait for them before actually starting the server
  this.once('modulesReady', function (app) {
    // start server
    app.server.listen(app.configuration.getConfig('serverPort'));
    app.emit("serverStarted", app.server);
  });

  // load core subsystems
  this.configuration = require('./configuration');
  this.configuration.load(path.join(this.configuration.serverRoot, this.options.configFile));
  this.logger = require('./logger');
  this.filestorage = require('./filestorage');
  this.pluginManager = pluginmanager.getManager();
  this.db = database.getDatabase(this.configuration.getConfig('dbType'), this.configuration.serverRoot);
  this.waitForModule(this.db, 'database');

  // create/configure an express server and pass on to our init method
  var server = express();
  server.configure(function () {
    server.use(require('./permissions').policyChecker());
    server.use(express.bodyParser());
    server.use(express.methodOverride());
    server.use(server.router);
    server.use(express.static(__dirname + '/public'));
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

  this.server = server;
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
