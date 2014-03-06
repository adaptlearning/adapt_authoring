/**
 * Content Management Interface
 */

var path = require('path'),
    fs = require('fs'),
    util = require('util'),
    EventEmitter = require('events').EventEmitter,
    configuration = require('./configuration'),
    logger = require('./logger'),
    rest = require('./rest'),
    database = require('./database');

/*
 * CONSTANTS
 */
var MODNAME = 'contentmanager',
    WAITFOR = 'pluginmanager';

// errors
function ContentTypeError (message) {
  this.name = 'ContentTypeError';
  this.message = message || 'Content type not recognized';
};

util.inherits(ContentTypeError, Error);

/**
 * ContentManager class
 */

function ContentManager () {
  this._contentSchema = Object.create(null);
}

// ContentManager is an eventemitter
util.inherits(ContentManager, EventEmitter);

/**
 * adds a new content model
 *
 * @param {string} name - name of the model
 * @param {object} schema - the model definition
 */

ContentManager.prototype.addModel = function (name, schema) {
  var self = this;
  database.getDatabase(function(err, db){
    if (!name || 'string' !== typeof name) {
      logger.log('error', 'ContentManager#addModel: "name" parameter must be string!');
      // @TODO - should we throw an error?
      return false;
    }

    name = name.toLowerCase();
    // let the database keep track of models
    return db.addModel(name, schema);
  });
};

/**
 * checks that a model exists and returns it if so
 *
 * @param {string} name - the name of the model to retrieve
 * @return {boolean|object} the model, or false if model is not found
 */

ContentManager.prototype.checkModelExists = function (name, callback) {
  if (!name || 'string' !== typeof name) {
    logger.log('error', 'ContentManager#getModel: "name" parameter must be string!');
    return callback(false);
  }
  // defer model checking to the database
  // no need to maintain two lists of models
  database.getDatabase(function (err, db) {
    callback(db.getModel(name));
  });
};

/**
 * preload function
 *
 * @param {object} app - AdaptBuilder instance
 * @return {object} preloader - an AdaptBuilder ModulePreloader
 */
ContentManager.prototype.preload = function (app) {
  var preloader = new app.ModulePreloader(app, MODNAME, {events:preloadHandle(app,this)});
  return preloader;
};

/**
 * sets up rest service routes
 */
ContentManager.prototype.setupRoutes = function () {
  var that = this;

  // creation
  rest.post('/content/:type', function (req, res, next) {
    var type = req.params.type;
    var val = req.body;
    val.createdBy = req.user._id;

    if (!val || 'object' !== typeof val) {
      res.statusCode = 400;
      res.json({success: false, message: 'request body was not a valid object'});
      return res.end();
    }

    that.create(type, val, function (error, result) {
      if (error) {
        res.statusCode = error instanceof ContentTypeError ? 400 : 500;
        res.json({ success: false, message: error.message });
        return res.end();
      }

      res.statusCode = 200;
      res.json(result);
      return res.end();
    });
  });

  // retrieve all
  rest.get('/content/:type', function (req, res, next) {
    var type = req.params.type; // type is expected to be singular
    var search = req.query;
    that.retrieve(type, search, function (error, results) {
      if (error) {
        res.statusCode = error instanceof ContentTypeError ? 400 : 500;
        res.json({succes: false, message: error.message});
        return res.end();
      }

      // @TODO - we need to filter resources according to permissions!
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.statusCode = 200;
      res.json(results);
      return res.end();
    });
  });

  // query all
  rest.get('/content/:type/query', function (req, res, next) {
    var type = req.params.type; // type is expected to be singular
    var query = _.keys(req.body).length
      ? req.body
      : req.query;
    var search = query.search || {};
    that.retrieve(type, search, query, function (error, results) {
      if (error) {
        res.statusCode = error instanceof ContentTypeError ? 400 : 500;
        res.json({succes: false, message: error.message});
        return res.end();
      }

      // @TODO - we need to filter resources according to permissions!
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.statusCode = 200;
      res.json(results);
      return res.end();
    });
  });

  // retrieve one
  rest.get('/content/:type/:id', function (req, res, next) {
    var type = req.params.type;
    var id = req.params.id;
    if (!id || 'string' !== typeof id) {
      res.statusCode = 400;
      res.json({success: false, message: 'id is required'});
      return res.end();
    }

    that.retrieve(type, { _id: id }, function (error, results) {
      if (error) {
        res.statusCode = error instanceof ContentTypeError ? 400 : 500;
        res.json({success: false, message: error.message});
        return res.end();
      }

      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      var ret = (results && 1 == results.length)
         ? results[0]
         : {}; // ok to send an empty object?
      res.statusCode = 200;
      res.json(ret);
      return res.end();
    });
  });

  // update one
  rest.put('/content/:type/:id', function (req, res, next) {
    var type = req.params.type;
    var id = req.params.id;
    var val = req.body;
    if (!val || 'object' !== typeof val) {
      res.statusCode = 400;
      res.json({success: false, message: 'request body was not a valid object'});
      return res.end();
    }

    // @TODO - we need to check permissions!
    that.update(type, { _id: id }, val, function (error, updatedDocument) {
      if (error) {
        res.statusCode = error instanceof ContentTypeError ? 400 : 500;
        res.json({success: false, message: error.message});
        return res.end();
      }

      res.statusCode = 200;
      res.json({success: true});
      return res.end();
    });
  });

  // delete one
  rest.delete('/content/:type/:id', function (req, res, next) {
    var type = req.params.type;
    var id = req.params.id;
    if (!id || 'string' !== typeof id) {
      res.statusCode = 400;
      res.json({success: false, message: 'id is required'});
      return res.end();
    }

    // @TODO - we need to check permissions!
    that.destroy(type, { _id: id }, function (error) {
      if (error) {
        res.statusCode = error instanceof ContentTypeError ? 400 : 500;
        res.json({success: false, message: error.message});
        return res.end();
      }

      res.statusCode = 200;
      res.json({success: true});
      return res.end();
    });
  });
};

ContentManager.prototype.loadSchemas = function (schemaDirectory, callback) {
  var instance = this;
  fs.readdir(schemaDirectory, function (error, results) {
    if (error) {
      logger.log('error', 'failed to fetch directory listing', error);
      return callback(error)
    } else if (results && results.length) {
      var i = 0;

      for (; i < results.length; ++i) {
        var filename = results[i];

        if ('.schema' === path.extname(filename)) {

          var modelName = path.basename(filename, '.schema');
          var fullPath = path.join(schemaDirectory, filename);

          try {
            var schema = fs.readFileSync(fullPath);
            schema = JSON.parse(schema);
            instance.addModel(modelName, schema);
          } catch (error) {
            // try and 'require' the file instead
            try {
              schema = require(fullPath);
              instance.addModel(modelName, schema);
            } catch (error) {
              logger.log('error', 'failed to require schema file at ' + fullPath, error);
            }
          }
        }
      }

    }
    callback();
  });
};

/**
 * listener for database creation events
 * @param {object} db - the database that was created
 */
ContentManager.prototype.onDatabaseCreated = function (db) {
  var schemaDirectory = path.join(configuration.serverRoot, 'lib', 'contentSchema');
  this.loadSchemas(schemaDirectory, function (error) {
    if (error) {
      logger.log('error', error.message, error);
    }
  });
};

/**
 * Event handler for preload events
 *
 * @param {object} app - Server instance
 * @param {object} instance - Instance of this module
 * @return {object} hash map of events and handlers
 */
function preloadHandle(app, instance){

  return {
      preload : function(){
        var preloader = this;
        preloader.emit('preloadChange', MODNAME, app.preloadConstants.WAITING);
      },

      moduleLoaded : function(modloaded){
        var preloader = this;

         //is the module that loaded this modules requirement
        if(modloaded === WAITFOR){
          app.contentmanager = instance;
          instance.setupRoutes();
          preloader.emit('preloadChange', MODNAME, app.preloadConstants.COMPLETE);
          app.on('create:database', instance.onDatabaseCreated.bind(instance));
        }
      }
    };
}

// add CRUD wrappers
["create", "retrieve", "update", "destroy"].forEach( function (el, index, array) {
  ContentManager.prototype[el] = function () {
    var callargs = arguments;
    var args = Array.prototype.slice.call(arguments);
    var type = args.shift();
    var cb = args.pop();
    this.checkModelExists(type, function(modelExists) {
      if (!modelExists) {
        return cb(new ContentTypeError());
      }

      database.getDatabase(function(err, db){
        db[el].apply(db, callargs);
      });
    });
  };
});

exports = module.exports = new ContentManager();
