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
 * initialises the main subsystems of the app, with the exception of the server
 * which is an express instance, but might not be in future ...
 *
 * @api public
 * @param {object} server - the http server instance
 */

AdaptBuilder.prototype.init = function(server) {
  this.server = server;

  // load core subsystems
  this.configuration = require('./configuration');
  this.configuration.load(path.join(this.configuration.serverRoot, this.options.configFile));
  this.logger = require('./logger');
  this.filestorage = require('./filestorage');
  this.pluginManager = pluginmanager.getManager();
  this.db = database.getDatabase(this.configuration.getConfig('dbType'), this.configuration.serverRoot);

  // start server
  this.server.listen(this.configuration.getConfig('serverPort'));
};

AdaptBuilder.prototype.listen = function() {
  this.init(express());
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
