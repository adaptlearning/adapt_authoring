/**
 * Content Management Interface
 */

var path = require('path'),
    fs = require('fs'),
    util = require('util'),
    async = require('async'),
    EventEmitter = require('events').EventEmitter,
    configuration = require('./configuration'),
    logger = require('./logger'),
    rest = require('./rest'),
    pluginmanager = require('./pluginmanager'),
    database = require('./database'),
    origin = require('../');

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
 * base constructor for ContentPlugin plugins
 * @api public
 */
function ContentPlugin () {
}

/**
 * extending plugins must implement this
 *
 * @return {string}
 */
ContentPlugin.prototype.getModelName = function () {
  logger.log('error', 'ContentPlugin#getModelName must be implemented by extending objects!');
  throw new ContentTypeError('ContentPlugin#getModelName must be implemented by extending objects!');
};

/**
 * most content plugins will have children
 *
 * @api public
 * @return {string} the name of the child plugin to retrieve with
 *  ContentManager#getContentPlugin or false if no child type is defined
 */
ContentPlugin.prototype.getChildType = function () {
  return false;
};

/**
 * extending plugins should override _modelname does not match dirname
 *
 * @return {string}
 */
ContentPlugin.prototype.getSchemaPath = function () {
  return path.join(configuration.serverRoot, 'plugins', 'content', this.getModelName(), 'model.schema');
};

/**
 * add content schema to the database via this function
 *
 * @param {object} db
 */
ContentPlugin.prototype.onDatabaseCreated = function (db) {
  var schemaPath = this.getSchemaPath();

  try {
    var schema = fs.readFileSync(schemaPath);
    schema = JSON.parse(schema);
    db.addModel(this.getModelName(), schema);
  } catch (error) {
    logger.log('error', 'failed to parse schema file at ' + schemaPath, error);
  }
};

/**
 * default implementation of create
 *
 * @param {callback} next
 */
ContentPlugin.prototype.create = function (data, next) {
  // must have a model name
  if (!this.getModelName()) {
    return next(new ContentTypeError('this.getModelName() must be set!'));
  }

  data._type = data._type || this.getModelName();

  var self = this;
  database.getDatabase(function (error, db) {
    if (error) {
      return next(error);
    }

    data.createdAt = data.createdAt || new Date();
    data.updatedAt = data.updatedAt || new Date();

    return db.create(self.getModelName(), data, next);
  });
};

/**
 * default implementation of retrieve
 *
 * @param {object} search
 * @param {object} options
 * @param {callback} next
 */
ContentPlugin.prototype.retrieve = function (search, options, next) {
  // must have a model name
  if (!this.getModelName()) {
    return next(new ContentTypeError('this.getModelName() must be set!'));
  }

  var self = this;
  database.getDatabase(function (error, db) {
    if (error) {
      return next(error);
    }

    return db.retrieve(self.getModelName(), search, options, next);
  });
};

/**
 * default implementation of update
 *
 * @param {object} search
 * @param {object} delta
 * @param {callback} next
 */
ContentPlugin.prototype.update = function (search, delta, next) {
  // must have a model name
  if (!this.getModelName()) {
    return next(new ContentTypeError('this.getModelName() must be set!'));
  }

  var self = this;
  database.getDatabase(function (error, db) {
    if (error) {
      return next(error);
    }

    delta.updatedAt = delta.updatedAt || new Date();

    return db.update(self.getModelName(), search, delta, next);
  });
};

/**
 * default implementation of destroy
 *
 * @param {object} search
 * @param {callback} next
 */
ContentPlugin.prototype.destroy = function (search, next) {
  // must have a model name
  if (!this.getModelName()) {
    return next(new ContentTypeError('this.getModelName() must be set!'));
  }

  var self = this;
  database.getDatabase(function (error, db) {
    if (error) {
      return next(error);
    }

    return db.destroy(self.getModelName(), search, next);
  });
};

/**
 * utility function - iterates siblings of a content document and applies iterator function to each
 *
 * @param {ObjectID|string} parentId - the parentId of the instance to update
 * @param {object} [options] - optional options passed to db.retrieve
 * @param {function} iterator - the function to apply to each instance
 * @param {callback} next
 */
ContentPlugin.prototype.iterateSiblings = function (parentId, options, iterator, next) {
  var self = this;
  // shuffle params
  if ('function' === typeof options) {
    next = iterator;
    iterator = options;
    options = null;
  }

  database.getDatabase(function (error, db) {
    if (error) {
      return next(error);
    }

    db.retrieve(self.getModelName(), { _parentId: parentId }, options, function (error, results) {
      if (error) {
        return next(error);
      }

      if (results.length) {
        return async.eachSeries(results, iterator, next);
      }

      return next();
    });
  });
};

/**
 * cascading delete - a content plugin may call this function within its
 * destroy() method to cascade deletion
 *
 * @param {objectid} parentId - the parent of the children we wish to eliminate
 * @param {callback} next
 */
ContentPlugin.prototype.destroyChildren = function (parentId, next) {
  var self = this;
  var app = origin();
  // cascading delete!
  if (self.getChildType() && parentId) {
     app.contentmanager.getContentPlugin(self.getChildType(), function (error, plugin) {
       if (error) {
         return next(error);
       }

       plugin.destroy({_parentId:parentId}, next);
     });
  } else {
    next(null); // explicit no error
  }
};

/**
 * ContentManager class
 */

function ContentManager () {
  this._contentTypes = Object.create(null);
}

// ContentManager is an eventemitter
util.inherits(ContentManager, EventEmitter);

/**
 * gets a content plugin instance
 *
 * @param {string} type - the type(name) of the content plugin
 * @param {callback} cb
 */

ContentManager.prototype.getContentPlugin = function (type, cb) {
  var self = this;
  if (self._contentTypes[type]) {
    return cb(null, self._contentTypes[type]);
  }

  var pluginManager = pluginmanager.getManager();
  pluginManager.getPlugin('content', type, function (error, pluginInfo) {
    if (error) {
      return cb(new ContentTypeError('content type plugin ' + type + ' was not found'));
    }

    try {
      var ContentPlugin = require(pluginInfo.fullPath);
      self._contentTypes[type] = new ContentPlugin(); // not sure we need to memoize
      cb(null, self._contentTypes[type]);
    } catch (err) {
      return cb(err);
    }
  });
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
    var options = req.query.operators || {};
    that.retrieve(type, search, options, function (error, results) {
      if (error) {
        res.statusCode = error instanceof ContentTypeError ? 400 : 500;
        res.json({success: false, message: error.message});
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
    var options = _.keys(req.body).length
      ? req.body
      : req.query;
    var search = options.search || {};
    that.retrieve(type, search, options, function (error, results) {
      if (error) {
        res.statusCode = error instanceof ContentTypeError ? 400 : 500;
        res.json({success: false, message: error.message});
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
      if (results && 1 == results.length) {
        res.statusCode = 200;
        return res.json(results[0]);
      }

      res.statusCode = 404;
      return res.json({success: false, message: 'Object not found'});
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

/**
 * listener for database creation events
 * @param {object} db - the database that was created
 */
ContentManager.prototype.onDatabaseCreated = function (db) {
  var self = this;
  var pluginManager = pluginmanager.getManager();
  pluginManager.getPlugin('content', function (error, plugins) {
    Object.keys(plugins).forEach(function (key) {
      self.getContentPlugin(key, function (error, contentPlugin) {
        if (error) {
          logger.log('error', 'Failed to load content plugin of type: ' + key, error);
          return;
        }
        contentPlugin.onDatabaseCreated(db);
      });
    });
  });
};

// add CRUD wrappers
["create", "retrieve", "update", "destroy"].forEach( function (el, index, array) {
  ContentManager.prototype[el] = function () {
    var callargs = arguments;
    var args = Array.prototype.slice.call(arguments);
    var type = args.shift();
    var cb = args[args.length - 1];
    type = type && type.toLowerCase(); // all content type names are lowercase!

    this.getContentPlugin(type, function (error, contentPlugin) {
      if (error) {
        return cb(error);
      }

      return contentPlugin[el].apply(contentPlugin, args);

    });
  };
});

exports = module.exports = {
  // expose the content manager constructor
  ContentManager : ContentManager,

  // expose the content plugin constructor
  ContentPlugin  : ContentPlugin,

  // expose errors
  errors: {
    ContentTypeError: ContentTypeError
  },


  /**
   * preload function
   *
   * @param {object} app - AdaptBuilder instance
   * @return {object} preloader - an AdaptBuilder ModulePreloader
   */
  preload : function (app) {
    var preloader = new app.ModulePreloader(app, MODNAME, { events: this.preloadHandle(app, new ContentManager()) });
    return preloader;
  },

  /**
   * Event handler for preload events
   *
   * @param {object} app - Server instance
   * @param {object} instance - Instance of this module
   * @return {object} hash map of events and handlers
   */
  preloadHandle : function (app, instance){

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

};
