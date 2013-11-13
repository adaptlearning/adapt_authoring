/**
 * Module used for logging events to the database ... eventually!
 *
 * @module lib/logger
 */

var _ = require('underscore'),
    winston = require('winston');

/**
 * @constructor
 */
function Log() {
  this.logger = new (winston.Logger)({ "exitOnError": false });
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
 * A wrapper for winston's log method
 *
 * @param {string} type - can be info, error, debug or data
 * @param {string} msg - the actual message for the log
 * @param {object|string} meta - any data useful to the log - will be stringified
 */
Log.prototype.log = function(type, msg, meta) {
  // ensure we use a valid logger method
  if (!(type && 'string' === typeof type) || !(this.logger[type] && 'function' === typeof this.logger[type])){
    type = 'info';
  }
  this.logger[type](msg, meta);
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
 * preload function
 *
 * @param {object} app - AdaptBuilder instance
 */

Log.prototype.preload = function (app) {
  app.logger = this;
};

exports = module.exports = new Log();
