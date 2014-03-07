/**
 * Module depencies
 */

var path = require('path'),
    fs = require('fs'),
    logger = require('./logger'),
    configuration = require('./configuration'),
    EventEmitter = require('events').EventEmitter,
    util = require('util');

/*
 * CONSTANTS
 */
var MODNAME = 'database',
    WAITFOR = 'configuration';

var errors = {
  'notthere': function(dbfile){
    Error.call(this); //super constructor
    Error.captureStackTrace(this, this.constructor); //super helper method to include stack trace in error object

    this.name = 'DatabaseNotAvailable';
    this.message = 'Database file unvailable at (' + dbfile + ')';
  },
  'nocallback':function(fnName){
    Error.call(this); //super constructor
    Error.captureStackTrace(this, this.constructor); //super helper method to include stack trace in error object

    this.name = 'DatabaseFunctionCalledWithoutCallback';
    this.message = 'Database function was called without being provided a callback :: ' + fnName;
  }
};

Object.keys(errors).forEach(function(fnName){
  util.inherits(errors[fnName], Error);
});


/**
 * @api private
 */
function getDriverPath () {
  return path.join(configuration.serverRoot, 'lib', 'dml');
}

/**
 * @api private
 */
function getSchemaPath () {
  return path.join(getDriverPath(), 'schema');
}


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
  throw new Error('Database.connect must be implemented by extending object!');
};

/**
 * loads any schemas from the specified location
 *
 * @abstract
 * @param {string} schemaDirectory - the directory from which to load schemas
 * @param {function} callback - Callback function to be called once all schemas are loaded
 */
Database.prototype.loadSchemas = function(schemaDirectory, callback) {
  logger.log('warn', 'Database.loadSchemas must be implemented by extending object!');
  throw new Error('Database.loadSchemas must be implemented by extending object!');
};

/**
 * add a new database model from json schema
 *
 * @param {string} modelName - case insensitive
 * @param {object} schema - json object
 */

Database.prototype.addModel = function (modelName, schema) {
  logger.log('warn', 'Database#addModel must be implemented by extending object!');
  throw new Error('Database#addModel must be implemented by extending object!');
};

/**
 * retrieves a model from the known model collection
 *
 * @param {string} modelName - the name of the model to retrieve
 * @return {object} model
 */

Database.prototype.getModel = function (modelName) {
  logger.log('warn', 'Database#getModel must be implemented by extending object!');
  throw new Error('Database#getModel must be implemented by extending object!');
};

/**
 * generate a populator object from passed options
 *
 * @param {object} options
 * @return {object} populate object that can be passed to Database#retrieve
 */
Database.prototype.buildPopulator = function (options) {
  logger.log('warn', 'Database#buildPopulator must be implemented by extending object!');
  throw new Error('Database#buildPopulator must be implemented by extending object!');
};

/**
 * generate a query from an options object
 *
 * @param {object} options
 * @return {object} query object that can be passed to Database#retrieve
 */
Database.prototype.buildQuery = function (options) {
  logger.log('warn', 'Database#buildQuery must be implemented by extending object!');
  throw new Error('Database#buildQuery must be implemented by extending object!');
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
 * @param {object} search
 * @param {object} [options]
 * @param {function} callback - of the form function (error, results) ...
 */
Database.prototype.retrieve = function(objectType, search, options, callback) {
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
 * should return a valid session store for connect session middleware
 *
 * @throws error if not implemented
 * @return {object} a session store compatible with connect sessions
 */
Database.prototype.getSessionStore = function() {
  logger.log('warn', 'Database#getSessionStore must be implemented by extending object!');
  throw new Error('Database#getSessionStore not implemented');
};

/**
 * Creates a database instance if it does not exists, otherwise returns the current database instance
 *
 * @param {function} cback - callback to be fired with the database object
 * @param {string} dbname - (optional) the name of the database
 * @param {string} type - (optional) the type of database connector to use (e.g 'mongoose')
 */
function getDatabase(cback, dbname, type) {
  if (!this.dbs){
    this.dbs = [];
  }

  if ('function' !== typeof cback) {
    logger.log('error', 'getDatabase called without callback function');
    throw new errors.nocallback('getDatabase');
  }

  if ('string' !== typeof type) {
    type = configuration.getConfig('dbType');
  }

  if ('string' !== typeof dbname) {
    var session = process.domain && process.domain.session;
    dbname = (session && session.user && session.user.tenant)
      ? session.user.tenant.database.dbName
      : configuration.getConfig('dbName');
  }

  var schemas = 'system';
  if (dbname !== configuration.getConfig('dbName')){
    schemas = 'tenant';
  }

  if (this.dbs[type] && this.dbs[type][dbname]){
    cback(null, this.dbs[type][dbname]);
  } else {
    if (!this.dbs[type]) {
      this.dbs[type]=[];
    }

    var dbPath = path.join(getDriverPath(), type + '.js');

    fs.exists(dbPath, function (exists) {
      if (exists) {
        var app = require('../')();
        var clsDB = require(dbPath);
        var dbInstance = new clsDB();
        this.dbs[type][dbname] = dbInstance;
        dbInstance.connect(dbname);
        dbInstance.getDatabase = this.getDatabase.bind(this);
        dbInstance.loadSchemas(path.join(getSchemaPath(), schemas), function (error) {
          cback(error, dbInstance);
          app.emit('create:database', dbInstance);
        }.bind(this));
      } else {
        this.dbs[type][dbname] = new Database();
        cback(new errors.notthere(dbPath), this.dbs[type][dbname]);
      }
    }.bind(this));
  }
}

/**
 * returns a list of available drivers
 *
 * @param {callback} cb - function that receives an array of driver names
 */
function getAvailableDrivers (cb) {
  fs.readdir(getDriverPath(), function (error, files) {
    if (error) {
      return cb(error);
    }

    var drivers = [];
    files.forEach(function (filename) {
      // presently, all drivers are just .js files. this may change!
      if ('.js' === path.extname(filename)) {
        drivers.push(path.basename(filename, '.js'));
      }
    });

    return cb(null, drivers);
  });
}


/**
 * preload function sets up event listener for startup events
 *
 * @param {object} app - the AdaptBuilder instance
 * @return {object} preloader - an AdaptBuilder ModulePreloader
 */
function preload(app) {

  var preloader = new app.ModulePreloader(app, MODNAME, {events:preloadHandle(app,this)});
  return preloader;
};

/**
 * Event handler for preload events
 *
 * @param {object} app Server instance
 * @param {object} instance Instance of this module
 */
function preloadHandle(app, instance){

  return {
    preload : function () {
      var preloader = this;
      preloader.emit('preloadChange', MODNAME, app.preloadConstants.WAITING);
    },
    moduleLoaded : function (modloaded) {
      var preloader = this;
       //is the module that loaded this modules requirement
      if (modloaded === WAITFOR) {
        // only set app.db when configuration is available
        app.on('serverStarted', function (server) {
          instance.getDatabase(function (err, db) {
            if (err) {
              logger.log('error', 'failed to set app.db!', err);
              return false;
            }
            app.db = db;
          });
        });


        // we proceed with minimal server
        preloader.emit('preloadChange', MODNAME, app.preloadConstants.COMPLETE);
      }
    }
  };

};

/**
 * Module exports
 */
module.exports.getDatabase = getDatabase;
module.exports.getAvailableDrivers = getAvailableDrivers;
module.exports.Database = Database;
module.exports.preload = preload;
