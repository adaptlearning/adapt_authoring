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
    usermanager = require('./usermanager'),
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
  if (!schemaPath) {
    return;
  }

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
  var user = usermanager.getCurrentUser();

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
    data._tenantId = user.tenant._id;

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
ContentPlugin.prototype.destroyChildren = function (parentId, parentAttribute, next) {
  var self = this;
  var app = origin();
  var childTypes = self.getChildType();

  // shuffle params
  if ('function' === typeof parentAttribute) {
    next = parentAttribute;
    parentAttribute = '_parentId';
  }

  // cascading delete!
  if (childTypes && parentId) {
    if (!util.isArray(childTypes)) {
      childTypes = [childTypes];
    }

    async.eachSeries(
      childTypes,
      function (childType, cb) {
        app.contentmanager.getContentPlugin(childType, function (error, plugin) {
          if (error) {
            return cb(error);
          }

          var search = {};
          search[parentAttribute] = parentId;
          plugin.destroy(search, cb);
        });
      },
      function (error) {
        if (error) {
          return next(error);
        }

        return next(null);
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
  this._contentHooks = Object.create(null);
}

// ContentManager is an eventemitter
util.inherits(ContentManager, EventEmitter);

/**
 * add a new content hook
 *
 * @param {string} action (create|retrieve|update|destroy)
 * @param {string} targetContent
 * @param {function} processor (should be of the form "function (data, callback) {}")
 */

ContentManager.prototype.addContentHook = function (action, targetContent, options, processor) {
  // shuffle params
  if ('function' === typeof options) {
    processor = options;
    options = { when: 'pre' };
  }

  if (!this._contentHooks[targetContent]) {
    this._contentHooks[targetContent] = {};
  }

  if (!this._contentHooks[targetContent][action]) {
    this._contentHooks[targetContent][action] = {};
  }

  if (!this._contentHooks[targetContent][action][options.when]) {
    this._contentHooks[targetContent][action][options.when] = [];
  }

  this._contentHooks[targetContent][action][options.when].push(processor);
};

/**
 * process any content hooks
 *
 * @param {string} action (create|retrieve|update|destroy)
 * @param {object} data
 * @param {object} [options]  { when : post|pre }
 * @param {callback} cb
 */

ContentManager.prototype.processContentHooks = function (action, contentType, data, options, cb) {
  // shuffle params
  if ('function' === typeof options) {
    cb = options;
    options = { when: 'pre' };
  }

  if (this._contentHooks[contentType] &&
      this._contentHooks[contentType][action] &&
      this._contentHooks[contentType][action][options.when]) {
    return async.map(
      this._contentHooks[contentType][action][options.when],
      function (hook, next) {
         hook(data, next);
      },
      function (err, results) {
        data = results.reduce(function (a, b) {
          a && a.forEach(function (item, index) {
            a[index] = _.extend(item, b[index]);
          });

          return a;
        });
        cb(null, data);
      }
    );
  }

  return cb(null, data);
};

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

    // add populator
    var populate = { tags: '_id title' };
    if (!options.populate) {
      options.populate = populate;
    }

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

    // add populator
    var options = {
      populate: { tags: '_id title' }
    };

    that.retrieve(type, { _id: id }, options, function (error, results) {
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
    var self = this;
    var callargs = arguments;
    var args = Array.prototype.slice.call(arguments);
    var type = args.shift();
    var cb = args[args.length - 1]; // swap the original callback so we can process our 'post' type content hooks
    args[args.length - 1] = function (err, results) {
      self.processContentHooks(el, type, results, { when : 'post' }, function (err, transformedResults) {
        return cb(err, transformedResults);
      });
    };

    type = type && type.toLowerCase(); // all content type names are lowercase!
    // process 'pre' type hooks before CRUD
    self.processContentHooks(el, type, args, function (error, transformedArgs) {
      self.getContentPlugin(type, function (error, contentPlugin) {
        if (error) {
          return cb(error);
        }

        return contentPlugin[el].apply(contentPlugin, transformedArgs);
      });
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
