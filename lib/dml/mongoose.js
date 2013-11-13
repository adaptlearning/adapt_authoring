var Database = require('../database').Database,
    MongoStore = require('connect-mongodb'),
    configuration = require('../configuration'),
    logger = require('../logger'),
    util = require('util'),
    fs = require('fs'),
    path = require('path'),
    mongoose = require('mongoose');

/**
 * @constructor
 */
function MongooseDB() {
  this.conn = false;
}

/**
 * Our MongooseDB object inherits from Database
 */
util.inherits(MongooseDB, Database);

/**
 * Implements Database.connect
 *
 */
MongooseDB.prototype.connect = function() {
  var dbHost = configuration.getConfig('dbHost');
  var dbUser = configuration.getConfig('dbUser');
  var dbPass = configuration.getConfig('dbPass');
  var dbPort = configuration.getConfig('dbPort');
  var dbName = configuration.getConfig('dbName');
  var authPart = dbUser && dbPass ? dbUser + ':' + dbPass + '@' : '';
  var portPart = dbPort ? ':' + dbPort : '';
  mongoose.connect('mongodb://' + authPart + dbHost + portPart + '/' + dbName,
    function (error) {
      if (error) {
        logger.log('error', 'MongooseDB#connect: failed to connect to mongodb', error);
      }
    });
  this.conn = mongoose.connection;
  this.conn.on('error', logger.log.bind(logger, 'error'));
  this._models = Object.create(null);


  this.getSessionStore = function () {
    return new MongoStore({
      db: {
        db: dbName,
        host: dbHost,
        port: dbPort,
        username: dbUser,
        password: dbPass
      }
    });
  };
};

/**
 * Implements Database.loadSchemas
 *
 * @param {string} schemaDirectory - path to the directory containing schemas
 */

MongooseDB.prototype.loadSchemas = function (schemaDirectory) {
  var that = this;
  fs.readdir(schemaDirectory, function (error, results) {
    if (error) {
      logger.log('error', 'failed to fetch directory listing', error);
    } else if (results && results.length){
      for (var i = 0; i < results.length; ++i) {
        var filename = results[i];
        if ('.schema' === path.extname(filename)) {
          var modelName = path.basename(filename, '.schema');
          var fullPath = path.join(schemaDirectory, filename);
          try {
            var schema = fs.readFileSync(fullPath);
            schema = JSON.parse(schema);
            that.addModel(modelName, mongoose.Schema(schema));
          } catch (error) {
            logger.log('error', 'failed to parse schema file', error);
          }
        }
      }

      // module is ready
      that.emit('moduleReady', 'database');
    }
  });
};

/**
 * Implements Database.create
 *
 * @param {string} objectType - the type of object to create, e.g. 'user'
 * @param {object} objectData - the data that defines the object
 * @param {function} callback - of the form function (error, results) ...
 */
MongooseDB.prototype.create = function(objectType, objectData, callback) {
  var Model = false;
  if (Model = this.getModel(objectType)) {
    var instance = new Model(objectData);
    instance.save(callback);
  } else {
    callback(new Error('MongooseDB#create: Failed to retrieve model with name ' + objectType));
  }
};

/**
 * Implements Database.retrieve
 *
 * @param {string} objectType - the type of object to find, e.g. 'user'
 * @param {object} searchParams - search parameters
 * @param {function} callback - of the form function (error, results) ...
 */
MongooseDB.prototype.retrieve = function(objectType, searchParams, callback) {
  var Model = false;
  if (Model = this.getModel(objectType)) {
    Model.find(searchParams, callback);
  } else {
    callback(new Error('MongooseDB#retrieve: Failed to retrieve model with name ' + objectType));
  }
};

/**
 * Implements Database.update
 *
 * @param {string} objectType - the type of object to update, e.g. 'user'
 * @param {object} conditions - identifies the object in the DB; should use unique id
 * @param {object} updateData - the data to update
 * @param {function} callback - of the form function (error, results) ...
 */
MongooseDB.prototype.update = function(objectType, conditions, updateData, callback) {
  var Model = false;
  if (Model = this.getModel(objectType)) {
    Model.update(conditions, updateData, callback);
  } else {
    callback(new Error('MongooseDB#update: Failed to retrieve model with name ' + objectType));
  }
};

/**
 * Implements Database.destroy
 *
 * @param {string} objectType - the type of object to delete, e.g. 'user'
 * @param {object} conditions - identifies the object in the DB; should use unique id
 * @param {function} callback - of the form function (error) ...
 */
MongooseDB.prototype.destroy = function(objectType, conditions, callback) {
  var Model = false;
  if (Model = this.getModel(objectType)) {
    Model.remove(conditions, callback);
  } else {
    callback(new Error('MongooseDB#destroy: Failed to retrieve model with name ' + objectType));
  }
};

/**
 * Adds a new model to the available models
 *
 * @param {string} modelName - the name of the model to add
 * @param {object} schema - the schema that defines the model
 * @throws - Will throw an error if the modelName is in use or if schema is not a valid mongoose Schema
 */
MongooseDB.prototype.addModel = function(modelName, schema) {
  if (this.getModel(modelName)) { // lets not allow overwriting of models
    logger.log('warn', 'MongooseDB#addModel: can\'t overwrite an existing model', modelName);
    throw new Error("MongooseDB#addModel - Failed to add the model " + modelName + ": it already exists");
  }

  if (!(schema && schema instanceof mongoose.Schema)) { // must be a mongoose schema
    logger.log('warn', 'MongooseDB#addModel: schema is not a valid mongoose Schema', schema);
    throw new Error("MongooseDB#addModel - Failed to add the model " + modelName + ": not a valid schema");
  }

  this._models[modelName] = mongoose.model(modelName, schema);
};


/**
 * Gets a model by name if loaded
 *
 * @param {string} modelName - the name of the Model to retrieve
 * @return {object|boolean} - A mongoose db schema or false
 */
MongooseDB.prototype.getModel = function(modelName) {
  if (modelName && this._models[modelName]) {
    return this._models[modelName];
  }

  return false;
};

exports = module.exports = new MongooseDB();

