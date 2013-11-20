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
  var db = database.getDatabase();
  if (!name || 'string' !== typeof name) {
    logger.log('error', 'ContentManager#addModel: "name" parameter must be string!');
    // @TODO - should we throw an error?
    return false;
  }

  name = name.toLowerCase();
  if (!this._contentSchema[name]) { // don't overwrite existing schemas
    this._contentSchema[name] = schema;
    return db.addModel(name, schema);
  }

  return false;
};

/**
 * gets a model that was previously added
 *
 * @param {string} name - the name of the model to retrieve
 * @return {boolean|object} the model, or false if model is not found
 */

ContentManager.prototype.getModel = function (name) {
  if (!name || 'string' !== typeof name) {
    logger.log('error', 'ContentManager#getModel: "name" parameter must be string!');
    return false;
  }

  return (this._contentSchema[name]);
};

/**
 * preload method
 *
 * @param {object} app - AdaptBuilder instance
 */

ContentManager.prototype.preload = function (app) {
  app.contentmanager = this;
  app.waitForModule(this, 'contentmanager');
  this.setupRoutes();

  var schemaDirectory = path.join(configuration.serverRoot, 'lib', 'contentSchema');
  var that = this;

  // load content schemas
  fs.readdir(schemaDirectory, function (error, results) {
    if (error) {
      logger.log('error', 'failed to fetch directory listing', error);
    } else if (results && results.length) {
      for (var i = 0; i < results.length; ++i) {
        var filename = results[i];
        if ('.schema' === path.extname(filename)) {
          var modelName = path.basename(filename, '.schema');
          var fullPath = path.join(schemaDirectory, filename);
          try {
            var schema = fs.readFileSync(fullPath);
            schema = JSON.parse(schema);
            that.addModel(modelName, schema);
          } catch (error) {
            logger.log('error', 'failed to parse schema file', error);
          }
        }
      }
    }

    // module is ready
    that.emit('moduleReady', 'contentmanager');
  });
};

/**
 * sets up rest service routes
 */

ContentManager.prototype.setupRoutes = function () {
  var that = this;

  // creation
  rest.put('/content/:type', function (req, res, next) {
    var type = req.params.type;
    var val = req.body;
    if (!val || 'object' !== typeof val) {
      res.statusCode = 400;
      res.json({success: false, message: 'request body was not a valid object'});
      return res.end();
    }

    that.create(type, val, function (error, result) {
      if (error) {
        res.statusCode = 500;
        res.json({ success: false, message: error.message });
        return res.end();
      }

      res.statusCode = 200;
      res.json(result);
      return res.end();
    });
  });

  // retrieve all
  rest.get('/content/:types', function (req, res, next) {
    var type = req.params.types.slice(0, -1); // types is expected to be plural
    that.retrieve(type, null, function (error, results) {
      if (error) {
        res.statusCode = 500;
        res.json({succes: false, message: error.message});
        return res.end();
      }

      // @TODO - we need to filter resources according to permissions!
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
        res.statusCode = 500;
        res.json({success: false, message: error.message});
        return res.end();
      }

      var ret = (results && 1 == results.length)
         ? results[0]
         : {}; // ok to send an empty object?
      res.statusCode = 200;
      res.json(ret);
      return res.end();
    });
  });

  // update one
  rest.post('/content/:type/:id', function (req, res, next) {
    var type = req.params.type;
    var id = req.params.id;
    var val = req.body;
    if (!val || 'object' !== typeof val) {
      res.statusCode = 400;
      res.json({success: false, message: 'request body was not a valid object'});
      return res.end();
    }

    // @TODO - we need to check permissions!
    that.update(type, { _id: id }, val, function (error, numAffected) {
      if (error) {
        res.statusCode = 500;
        res.json({success: false, message: error.message});
        return res.end();
      }

      res.statusCode = 200;
      res.json({success: (numAffected === 1)});
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
        res.statusCode = 500;
        res.json({success: false, message: error.message});
        return res.end();
      }

      res.statusCode = 200;
      res.json({success: true});
      return res.end();
    });
  });
};

// add CRUD wrappers
["create", "retrieve", "update", "destroy"].forEach( function (el, index, array) {
  ContentManager.prototype[el] = function () {
    var db = database.getDatabase();
    var args = Array.prototype.slice.call(arguments);
    var type = args.shift();
    if (!this.getModel(type)) {
      return cb(new ContentTypeError());
    }

    db[el].apply(db, arguments);
  };
});

exports = module.exports = new ContentManager();
