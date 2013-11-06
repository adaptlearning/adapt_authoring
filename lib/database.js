/**
 * Module depencies
 */

var path = require('path'),
    fs = require('fs'),
    logger = require('./logger'),
    configuration = require('./configuration'),
    EventEmitter = require('events').EventEmitter,
    util = require('util');

/**
 *
 * @constructor
 */

function Database() {
}

util.inherits(Database, EventEmitter);

/**
 * starts the database connection
 *
 * @abstract
 */
Database.prototype.connect = function() {
  logger.log('warn', 'Database.connect must be implemented by extending object!');
};

/**
 * loads any schemas from the specified location
 *
 * @abstract
 * @param {string} schemaDirectory - the directory from which to load schemas
 */
Database.prototype.loadSchemas = function(schemaDirectory) {
  logger.log('warn', 'Database.loadSchemas must be implemented by extending object!');
};

/**
 * creates a new object of specified type and inserts into the database
 *
 * @param {string} objectType - the type of object to create, e.g. 'user'
 * @param {object} objectData - the data that defines the object
 * @param {function} callback - of the form function (error, results) ...
 */
Database.prototype.create = function(objectType, objectData, callback) {
  logger.log('warn', 'Database#create must be implemented by extending object!');
  callback(new Error('Database#create not implemented'));
};

/**
 * retrieves an object or objects of specified type based on search params
 *
 * @param {string} objectType - the type of object to find, e.g. 'user'
 * @param {object} searchParams - search parameters
 * @param {function} callback - of the form function (error, results) ...
 */
Database.prototype.retrieve = function(objectType, searchParams, callback) {
  logger.log('warn', 'Database#retrieve must be implemented by extending object!');
  callback(new Error('Database#retrieve not implemented'));
};

/**
 * updates an object of specified type with objectData
 *
 * @param {string} objectType - the type of object to update, e.g. 'user'
 * @param {object} conditions - update objects that match these conditions; should use uniqueid
 * @param {object} updateData - the data to update the object with
 * @param {function} callback - of the form function (error, results) ...
 */
Database.prototype.update = function(objectType, conditions, updateData, callback) {
  logger.log('warn', 'Database#update must be implemented by extending object!');
  callback(new Error('Database#update not implemented'));
};

/**
 * deletes an object of specified type identified by objectData
 *
 * @param {string} objectType - the type of object to delete, e.g. 'user'
 * @param {object} conditions - update objects that match these conditions; should use uniqueid
 * @param {function} callback - of the form function (error) ...
 */
Database.prototype.destroy = function(objectType, conditions, callback) {
  logger.log('warn', 'Database#destroy must be implemented by extending object!');
  callback(new Error('Database#destroy not implemented'));
};

/**
 * Creates a database instance if it does not exists, otherwise returns the current database instance
 *
 * @param {string} type - the type of database connector to use (e.g 'mongoose')
 * @return {object} a new database object of specified type
 */
function getDatabase(type, serverRoot) {
  if (!this.db) {
    if ('string' !== typeof type) {
      throw new Error('Database not yet configured, or type was not specified');
    }

    var dbPath = path.join(serverRoot, 'lib', 'dml', type + '.js');
    this.db = {};
    if (fs.existsSync(dbPath)) {
      this.db = require(dbPath);
      this.db.connect();
      this.db.loadSchemas(path.join(serverRoot, 'lib', 'dml', 'schema'));
    } else {
      this.db = new Database();
    }
  }

  return this.db;
}

/**
 * Module exports
 */

module.exports.getDatabase = getDatabase;
module.exports.Database = Database;

