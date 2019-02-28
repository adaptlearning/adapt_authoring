// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
/**
 * Module used for logging
 *
 * @module lib/logger
 */

const _ = require('underscore')
const chalk = require('chalk');
const moment = require('moment');
const winston = require('winston');

/*
 * CONSTANTS
 */
const MODNAME = 'logger';

const colours = {
  debug: 'grey',
  info: 'cyan',
  warn: 'yellow',
  error: 'red'
};

/**
 * @constructor
 */
function Log() {
  this.logger = winston.createLogger({
    exitOnError: false,
    transports: [new winston.transports.Console()],
    format: winston.format.printf((info) => {
      const colorise = chalk[colours[info.level]] || (level => level);
      return `${colorise(info.level)} [${moment().format('DD MMM YY HH:mm:ss Z')}] ${info.message}`;
    })
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
* Function to change transports log level
*/
Log.prototype.level = function(type, level) {
  const transport = this.logger.transports.find(transport => transport.name === type);
  if (!transport) {
    return console.log("Unknown transport type", type);
  }
  transport.level = level;
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
