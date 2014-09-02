var Database = require('../../database').Database,
    MongoStore = require('connect-mongodb'),
    configuration = require('../../configuration'),
    MongooseImporter = require('./importer').ImportManager,
    logger = require('../../logger'),
    util = require('util'),
    fs = require('fs'),
    path = require('path'),
    mongoose = require('mongoose');
    _ = require('underscore');

// private functions
function transformArrayAttributes (schema) {
  Object.keys(schema).forEach(function (key) {
    if ('array' === schema[key].type && schema[key].items) {
      schema[key] = [schema[key].items];
    }
    // could recurse into objects here?
  });

  return schema;
}

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
  this.conn.once('error', function(){ logger.log('error', 'Database Connection failed, please check your database'); }); //added to give console notification of the problem

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
        var modelName = path.basename(file, '.schema'),
          fullPath = path.join(schemaDirectory, file),
          schema;
        fs.readFile(fullPath, function (error, data) {
          if (error) {
            logger.log('error', 'failed to read schema file', error);
          } else {
            try {
              this.addModel(modelName, JSON.parse(data));
            } catch (err) {
              logger.log('error', 'failed to parse schema file at ' + fullPath, err);
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
 * generate a populator object from passed fields
 *
 * @param {Object|Array} options
 * @return {object} populate object that can be passed to Database#retrieve
 */
MongooseDB.prototype.buildPopulator = function (options) {
  var populator = null;

  // might just pass the fields to populate
  if (util.isArray(options)) {
    populator = options.join(' ');

  } else if ('object' === typeof options) {
    populator = [];
    Object.keys(options).forEach(function (key) {
      // add new populate query
      var p = {path: key, select: null};
      if (util.isArray(options[key])) {
        p.select = options[key].join(' ');
      } else if ('string' === typeof options[key]) {
        p.select = options[key];
      }
      populator.push(p);
    });
  }

  return populator;
};

/**
 * generate a query from an options object
 *
 * @param {object} options
 * @return {object} query object that can be passed to Database#retrieve
 */
MongooseDB.prototype.buildQuery = function (options) {
  // imagine options:
  // {
  //    'limit': 'amount',
  //    'skip': 'amount',
  //    'sort': {fieldname: -1, fieldname2: 1},
  //    'distinct': 'fieldname'
  //    'elemMatch' : { field : $match }
  // }
  // mongoose doesn't need to transform these
  return options;
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
 * @param {object} search - fields to search on
 * @param {object} [options] -
 * @param {function} callback - of the form function (error, results) ...
 */
MongooseDB.prototype.retrieve = function(objectType, search, options, callback) {
  // shuffle params
  if ('function' === typeof options) {
    callback = options;
    options = {};
  }

  var operators = options.operators
    ? this.buildQuery(options.operators)
    : null;
  var populator = options.populate
    ? this.buildPopulator(options.populate)
    : null;
  var fields = options.fields || null;
  var Model = false;
  var sort = false;
  var skip = false;
  var limit = false;
  var distinct = false;
  var elemMatch = false;

  if (operators && 'object' === typeof operators) {
    if (operators.sort && 'object' === typeof operators.sort) {
      sort = operators.sort;
    }

    if (operators.skip) {
      skip = parseInt(operators.skip, 10);
    }

    if (operators.limit) {
      limit = parseInt(operators.limit, 10);
    }

    if (operators.distinct && 'string' === typeof operators.distinct) {
      distinct = operators.distinct;
    }

    if (operators.elemMatch && 'object' === typeof operators.elemMatch) {
      elemMatch = operators.elemMatch;
    }
  }

  if (Model = this.getModel(objectType)) {
    var query = {};

    if (distinct) {
      query = Model.distinct(distinct, search);
    } else if (elemMatch) {
      query = Model.find(null).elemMatch(elemMatch.collection, elemMatch.query);
    } else {
      query = Model.find(search, fields);
    }

    // apply any query operators
    // do sort first
    if (sort && !distinct) {
      query.sort(operators.sort);
    }

    // ... then skip
    if (skip) {
      Number.isNaN(skip) || query.skip(skip);
    }

    // ... then limit
    if (limit) {
      Number.isNaN(limit) || query.limit(limit);
    }

    // populate subdocuments if requested
    if (populator) {
      if ('string' === typeof populator) {
        query.populate(populator);
      } else if (util.isArray(populator)) {
        populator.forEach(function (el) {
          query.populate(el);
        });
      }
    }
    query.exec(callback);
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
    // Model.update(conditions, updateData, callback);
    // .update doesn't call the pre-, post- hooks (see the schema)

    Model.findOne(conditions, function (err, doc) {
      if (err) {
        return callback(err);
      }

      if (!doc) {
        return callback(null, null, 0);
      }

      for (var field in updateData) {
        doc[field] = updateData[field];
        if (field !== '_id') {
          doc.markModified(field);
        }
      }
      doc.save(callback);
    });
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
MongooseDB.prototype.addSchema = function (modelName, schema) {
  var rawSchema = schema;
  if (!modelName || 'string' !== typeof modelName) {
    throw new Error("MongooseDB#addModel: modelName parameter must me a string!");
  }

  // lowercase all modelNames
  modelName = modelName.toLowerCase();
  if (this.getModel(modelName)) { // lets not allow overwriting of models
    logger.log('warn', 'MongooseDB#addModel: can\'t overwrite an existing model', modelName);
    throw new Error("MongooseDB#addModel - Failed to add the model " + modelName + ": it already exists");
  }

  // need to cope with array json-schema syntax
  schema = transformArrayAttributes(schema);

  if (!(schema instanceof mongoose.Schema)) { // might already be a mongoose schema
    schema = mongoose.Schema(schema);
  }

  if (!(schema && schema instanceof mongoose.Schema)) { // must be a mongoose schema
    logger.log('warn', 'MongooseDB#addModel: schema is not a valid mongoose Schema', schema);
    throw new Error("MongooseDB#addModel - Failed to add the model " + modelName + ": not a valid schema");
  }

  // handle protected attributes
  schema.options.toJSON = {
    transform: function (doc, json, options) {
      Object.keys(rawSchema).forEach(function (key) {
        if (options && options.forExport && rawSchema[key].editorOnly && json.hasOwnProperty(key)) {
          delete json[key];
        }

        if (rawSchema[key].protect && json.hasOwnProperty(key)) {
          delete json[key];
        }

        json.hasOwnProperty('__v') && delete json['__v'];
      });
    }
  };

  // replaced mongoose.model() with below as suggested by http://www.nodejsnotes.com/2013/05/mongoose-and-multiple-database.html
  // fixes the issue of Model readyState disconnecting mid call
  this._models[modelName] = this.conn.model(modelName, schema);
};

/**
 * imports an Origin schema and converts to Mongoose schema
 *
 * @param {string} uri
 * @param {string} schema
 * @param {callback} next
 */
MongooseDB.prototype.importSchema = function (uri, schema, next) {
  var importManager = new MongooseImporter();
  var importer = importManager.getImporter(uri);
  var self = this;
  importer.importSchema(schema, function () {
    if (importer.error) {
      return next(importer.error);
    }

    importer.getSchema(function (err, importedSchema) {
      if (err) {
        return next(err);
      }
      next(null, importedSchema);
    });
  });
};

/**
 * runs export filter on a result set
 *
 * @param {object|array} results
 * @param {callback} next
 */
MongooseDB.prototype.exportResults = function (results, next) {
  if (util.isArray(results)) {
    results.forEach(function (item, index) {
      results[index] = item.toJSON({transform: true, forExport: true});
    });
  } else if ('object' === typeof results) {
    results = results.toJSON({ transform: true, forExport: true });
  }
  next(results);
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
