var Database = require('../database').Database,
    MongoStore = require('connect-mongodb'),
    configuration = require('../configuration'),
    logger = require('../logger'),
    util = require('util'),
    fs = require('fs'),
    path = require('path'),
    mongoose = require('mongoose');
	_ = require('underscore');

/**
 * @constructor
 */
function MongooseDB() {
  this.conn = false;
  this._models = false;
}

/**
 * Our MongooseDB object inherits from Database
 */
util.inherits(MongooseDB, Database);

/**
 * Implements Database.connect
 *
 */
MongooseDB.prototype.connect = function(dbName) {
  var dbHost = configuration.getConfig('dbHost');
  var dbUser = configuration.getConfig('dbUser');
  var dbPass = configuration.getConfig('dbPass');
  var dbPort = configuration.getConfig('dbPort');
  var dbName = configuration.getConfig('dbName');
  var authPart = dbUser && dbPass ? dbUser + ':' + dbPass + '@' : '';
  var portPart = dbPort ? ':' + dbPort : '';

  this.conn = mongoose.createConnection('mongodb://' + authPart + dbHost + portPart + '/' + dbName);
  this.conn.on('error', logger.log.bind(logger, 'error'));

  this._models = {};

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
 * @param {function} callback
 */

MongooseDB.prototype.loadSchemas = function (schemaDirectory, callback) {

  fs.readdir(schemaDirectory, function(error,files){
    if (error) {
      logger.log('error', 'failed to fetch directory listing', error);
      callback(error);
      return false;
    }

    var procFile = function (file, callback) {
      if ('.schema' === path.extname(file)) {
        var modelName = path.basename(file, '.schema');
        var fullPath = path.join(schemaDirectory, file);
        fs.readFile(fullPath, function (error,data) {
          if (error) {
            logger.log('error', 'failed to read schema file', error);
          } else {
            try {
              this.addModel(modelName,JSON.parse(data));
            } catch (err) {
              error = err;
              logger.log('error', 'failed to parse schema file json', error);
            }
          }

          callback();
        }.bind(this));
      } else {
       callback();
      }
    }.bind(this);

    var handle = function() {
      if (!files || 0 === files.length){
        //finished
        callback(null);
      } else {
        procFile(files.shift(),handle);
      }
    }.bind(this);

    //load schema files
    handle();

  }.bind(this));
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
  // lowercase all modelNames
  if (!modelName || 'string' !== typeof modelName) {
    throw new Error("MongooseDB#addModel: modelName parameter must me a string!");
  }

  // lowercase all models
  modelName = modelName.toLowerCase();
  if (this.getModel(modelName)) { // lets not allow overwriting of models
    logger.log('warn', 'MongooseDB#addModel: can\'t overwrite an existing model', modelName);
    throw new Error("MongooseDB#addModel - Failed to add the model " + modelName + ": it already exists");
  }

  schema = mongoose.Schema(schema);
  if (!(schema && schema instanceof mongoose.Schema)) { // must be a mongoose schema
    logger.log('warn', 'MongooseDB#addModel: schema is not a valid mongoose Schema', schema);
    throw new Error("MongooseDB#addModel - Failed to add the model " + modelName + ": not a valid schema");
  }

  // replaced mongoose.model() with below as suggested by http://www.nodejsnotes.com/2013/05/mongoose-and-multiple-database.html
  //fixes the issue of Model readyState disconnecting mid call
  this._models[modelName] = this.conn.model(modelName, schema);
};


/**
 * Gets a model by name if loaded
 *
 * @param {string} modelName - the name of the Model to retrieve
 * @return {object|boolean} - A mongoose db schema or false
 */
MongooseDB.prototype.getModel = function(modelName) {
  if (!modelName || 'string' !== typeof modelName) {
    logger.log('error', 'MongooseDB#getModel: modelName parameter must be a string');
    return false;
  }

  // lowercase all models
  modelName = modelName.toLowerCase();
  if (this._models[modelName]) {
    return this._models[modelName];
  }

  return false;
};

exports = module.exports = MongooseDB;
