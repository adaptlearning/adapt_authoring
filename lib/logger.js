// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
/**
 * Module used for logging events to the database ... eventually!
 *
 * @module lib/logger
 */

var _ = require('underscore'),
  moment = require('moment'),
  winston = require('winston');

/*
 * CONSTANTS
 */
var MODNAME = 'logger';

/**
 * @constructor
 */
function Log() {
  this.logger = new (winston.Logger)({
    'exitOnError': false,
    'transports': [
      new (winston.transports.Console)({ level: 'info' })
    ]
  });
}

/**
 * A wrapper for winston's add method
 *
 * @param {string} tranport - eg. winston.transports.Console
 * @param {string} options - configuration options for this transport type
 */
Log.prototype.add = function(transport, options) {
  try {
    this.logger.add(transport, options);
  } catch (error) {
    // can't depend on debugger log, so send to console
    console.log(error);
  }
};

/**
* Function to change transpots log level
*/
Log.prototype.level = function(type, level) {
  if(!this.logger.transports.hasOwnProperty(type)) {
    return console.log("Unknown transport type", type);
  }
this.logger.transports[type].level = level;
};

/**
 * A wrapper for winston's clear method (removes all transports)
 *
 */
Log.prototype.clear = function() {
  try {
    this.logger.clear();
  } catch (error) {
    // can't depend on debugger log, so send to console
    console.log(error);
  }
};

/**
 * A wrapper for winston's log method
 *
 * @param {string} type - can be info, error, debug or data
 * @param {string} msg - the actual message for the log
 * @param {...*} extra - extra parameters passed to logger
 */
Log.prototype.log = function(type, msg, extra) {
  // ensure we use a valid logger method
  if (!(type && 'string' === typeof type) || !(this.logger[type] && 'function' === typeof this.logger[type])){
    type = 'info';
  }

  if (extra instanceof Error) { // to get around util.inspect
    extra = '[' + extra.message + ']';
  }

  msg = '[' + moment().format('DD MMM YYYY HH:mm:ss Z') + ']' + ' ' + msg;
  this.logger.log.apply(this.logger, arguments);
};

/**
 * A wrapper for winston's query method. see {@link https://github.com/flatiron/winston|winston on github} for details
 *
 * @param {object} options - fields/data to search
 * @param {function} callback - function to be called when results are returned
 */
Log.prototype.query = function(options, callback) {
  this.logger.query(options, callback);
};

/**
 * A wrapper for winstons event listener. see {@link https://github.com/flatiron/winston|winston on github} for details
 *
 * @param {string} eventName - event to listen to
 * @param {function} callback - function to execute on event
 */
Log.prototype.on = function(eventName, callback) {
  if ('string' === typeof eventName && 'function' === typeof callback) {
    this.logger.on(eventName, callback);
  }
};

/**
 * A wrapper for winston's event listener. see {@link https://github.com/flatiron/winston|winston on github} for details
 *
 * @param {string} eventName - event to listen to
 * @param {function} callback - function to execute on event
 */
Log.prototype.once = function(eventName, callback) {
  if ('string' === typeof eventName && 'function' === typeof callback) {
    this.logger.once(eventName, callback);
  }
};

/**
 * preload function called outside the startup events
 *
 * @param {object} app - Origin instance
 */
Log.prototype.init = function (app) {
  app.logger = this;
  app.once('configuration:changed', function () {
    // configure log levels
    var logLevel = app.configuration.get('logLevel');
    if (logLevel) {
      this.logger.level = logLevel;
    }
  }.bind(this));
};

exports = module.exports = new Log();
