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
  // load core subsystems
  this.configuration = require('./configuration');
  this.configuration.load(path.join(this.configuration.serverRoot, this.options.configFile));
  this.logger = require('./logger');
  this.filestorage = require('./filestorage');
  this.pluginManager = pluginmanager.getManager();
  this.db = database.getDatabase(this.configuration.getConfig('dbType'), this.configuration.serverRoot);

  // create/configure an express server and pass on to our init method
  var server = express();
  server.configure(function () {
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

  // start server
  this.server.listen(this.configuration.getConfig('serverPort'));
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
