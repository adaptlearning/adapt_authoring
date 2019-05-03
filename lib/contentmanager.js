// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
/**
 * Content Management Interface
 */

var path = require('path'),
    fs = require('fs'),
    util = require('util'),
    async = require('async'),
    EventEmitter = require('events').EventEmitter,
    configuration = require('./configuration'),
    permissions = require('./permissions'),
    logger = require('./logger'),
    semver = require('semver'),
    rest = require('./rest'),
    pluginmanager = require('./pluginmanager'),
    database = require('./database'),
    usermanager = require('./usermanager'),
    _ = require('underscore'),
    helpers = require('./helpers'),
    origin = require('../');

/*
 * CONSTANTS
 */
var MODNAME = 'contentmanager',
    WAITFOR = 'pluginmanager',
    COURSE_COLLECTIONS = [
      'article',
      'block',
      'component',
      'config',
      'contentobject',
      'course'
    ];

// errors
function ContentTypeError (message) {
  this.name = 'ContentTypeError';
  this.message = message || 'Content type not recognized';
};

util.inherits(ContentTypeError, Error);

function ContentPermissionError (message) {
  this.name = 'ContentPermissionError';
  this.message = message || 'You are not permitted to do that';
};

util.inherits(ContentPermissionError, Error);

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
  var type = this.getModelName();

  return COURSE_COLLECTIONS.includes(type) ?
    path.join(configuration.tempDir, configuration.getConfig('masterTenantID'), 'adapt_framework', 'src', 'core', 'schema', `${type}.model.schema`) :
    path.join(configuration.serverRoot, 'plugins', 'content', type, 'model.schema');
};

/**
 * add content schema to the database via this function
 *
 * @param {object} db
 * @param {callback} next
 */
ContentPlugin.prototype.onDatabaseCreated = function (db, next) {
  var schemaPath = this.getSchemaPath();
  var self = this;
  if (!schemaPath) {
    return next(null);
  }

  fs.readFile(schemaPath, function (err, data) {
    if (err) {
      logger.log('info', 'could not read schema file at ' + schemaPath);
      return next(null);
    }

    try {
      var modelName = self.getModelName();
      var schema = JSON.parse(data);
      var originalSchema = JSON.parse(data);
      db.addModel(modelName, schema, function (err, fullSchema) {
        // log an error, but don't die!
        if (err) {
          logger.log('error', 'Error importing content schema: ' + err.message, err);
        } else {
          app.contentmanager.addContentSchema(modelName, originalSchema);
        }

        return next(null);
      });
    } catch (error) {
      logger.log('error', 'failed to parse schema file at ' + schemaPath, error);
      return next(error);
    }
  });

};


/**
 * default implementation of hasPermission
 *
 * @param {string} action
 * @param {objectid} userId
 * @param {objectid} tenantId
 * @param {object} a content item
 * @param {callback} next (function (err, isAllowed))
 */
ContentPlugin.prototype.hasPermission = function (action, userId, tenantId, contentItem, next) {
  return next(null, false);
};

/**
 * default implementation of create
 *
 * @param {callback} next
 */
ContentPlugin.prototype.create = function (data, next) {
  if (typeof data == 'undefined') {
    return next(new ContentPermissionError());
  }

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

    // Check if the user has permission on this course
    self.hasPermission('create', user._id, user.tenant._id, data, function (err, isAllowed) {
      if (!isAllowed) {
        return next(new ContentPermissionError());
      }

      return db.create(self.getModelName(), data, next);
    });
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
  var user = app.usermanager.getCurrentUser();
  var tenantId = user.tenant && user.tenant._id;
  // must have a model name
  if (!this.getModelName()) {
    return next(new ContentTypeError('this.getModelName() must be set!'));
  }

  // Ensure the tags are populated
  var pop = { tags: '_id title' };
  if (!options.populate) {
    options.populate = pop;
  } else {
    options.populate = _.extend(pop, options.populate);
  }

  var self = this;
  database.getDatabase(function (error, db) {
    if (error) {
      return next(error);
    }

    db.retrieve(self.getModelName(), search, options, function (err, records) {
      if (err) {
        return next(err);
      }

      async.each(records, function(contentItem, callback) {
        if (self.getModelName() === 'course') {
          helpers.hasCoursePermission('retrieve', user._id, tenantId, contentItem, function (err, isAllowed) {
            if (!isAllowed) {
              return callback(new ContentPermissionError());
            }

            callback();
          });
        } else {
          self.hasPermission('retrieve', user._id, tenantId, contentItem, function (err, isAllowed) {
            if (!isAllowed) {
              return callback(new ContentPermissionError());
            }
            callback();
          });
        }
      }, function (error) {
        if (error) {
          return next(new ContentPermissionError());
        }

        return next(null, records);
      });
    });
  }, (options && options.tenantId));
};

/**
 * default implementation of update
 *
 * @param {object} search
 * @param {object} delta
 * @param {callback} next
 */
ContentPlugin.prototype.update = function (search, delta, next) {
  var user = app.usermanager.getCurrentUser();
  // must have a model name
  if (!this.getModelName()) {
    return next(new ContentTypeError('this.getModelName() must be set!'));
  }

  var self = this;

  // HACK -- This is for PATCH updates, which may not include the _id
  // The _id value is required in the subsequent hasCoursePermission() call
  if (!delta.hasOwnProperty('_id') && search.hasOwnProperty('_id')) {
    delta._id = search._id;
  }

  self.hasPermission('update', user._id, user.tenant._id, delta, function (err, isAllowed) {
    if (!isAllowed) {
      return next(new ContentPermissionError());
    }

    database.getDatabase(function (error, db) {
      if (error) {
        return next(error);
      }

      delta.updatedAt = delta.updatedAt || new Date();

      return db.update(self.getModelName(), search, delta, function(err, doc) {
        return next(err, doc);
      });
    });
  });
};

/**
 * default implementation of destroy
 *
 * @param {object} search
 * @param {boolean} [force] - if true, permissions are ignored
 * @param {callback} next
 */
ContentPlugin.prototype.destroy = function (search, force, next) {
  var user = app.usermanager.getCurrentUser();
  var tenantId = user.tenant && user.tenant._id;

  // shuffle params
  if ('function' === typeof force) {
    next = force;
    force = false;
  }

  // must have a model name
  if (!this.getModelName()) {
    return next(new ContentTypeError('this.getModelName() must be set!'));
  }

  var self = this;

  // Retrieve the full model
  self.retrieve(search, {}, function(err, results) {
    if (err) {
      logger.log('error', err);
    }

    if (!results || results.length == 0) {
      // Nothing to remove
      return next(null);
    }

    // Set the _courseId
    search._courseId = results[0]._courseId;

    self.hasPermission('delete', user._id, tenantId, search, function (err, isAllowed) {
      if (!isAllowed && !force) {
        return next(new ContentPermissionError());
      }

      database.getDatabase(function (error, db) {
        if (error) {
          return next(error);
        }

        return db.destroy(self.getModelName(), search, next);
      });
    });
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
          // we force the deletion of children
          plugin.destroy(search, true, cb);
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
  this._contentSchemas = Object.create(null);
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
  var hooks = this._contentHooks[contentType] && this._contentHooks[contentType][action] && this._contentHooks[contentType][action][options.when];

  if (!hooks) {
    return cb(null, data);
  }
  // execute all of the hooks
  async.map(hooks, function processHooks(hook, next) {
     hook(data, next);
  }, function onHooksMapped(err, results) {
    if (options.when == 'pre') {
      if(err) {
        return cb(err);
      }
      data = results.reduce(function (a, b) {
        a && a.forEach(function (item, index) {
          a[index] = _.extend(item, b[index]);
        });
        return a;
      });
    }
    cb(null, data);
  });
};

/**
 * loads content plugins - intended to be called once during bootstrapping
 *
 * @param {callback} next
 */

ContentManager.prototype.loadContentPlugins = function (next) {
  var self = this;
  var pluginManager = pluginmanager.getManager();
  pluginManager.getPlugin('content', function (err, plugins){
    async.eachSeries(
      Object.keys(plugins),
      function (pluginName, nextPlugin) {
        self.getContentPlugin(pluginName, nextPlugin);
      },
      next
    );
  });
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

  var blackList = [
    '_component',
    '_componentType',
    '_courseId',
    'createdAt',
    'createdBy',
    '_enabledExtensions',
    '_hasPreview',
    '_isDeleted',
    '_isSelected',
    '_latestTrackingId',
    '_layout',
    'layoutOptions',
    '_menu',
    '_parentId',
    '_sortOrder',
    '_supportedLayout',
    '_tenantId',
    '_theme',
    '_trackingId',
    '_type',
    'updatedAt',
    'updatedBy',
    'externalReferences',
    '_colorLabel',
    '_themePreset'
  ];

  // content manager handles it's own routes
  permissions.ignoreRoute(/^\/api\/content\/?.*$/);

  // retrieve all content schemas
  rest.get('/content/schema', function(req, res, next) {
    // memo of transformed schema data
    var memo = {
      schemas: helpers.cloneObject(that._contentSchemas), // cloned = safe to modify
      pluginTypes: [
        { collectionType: 'componenttype', type: 'component', key: '_components', settingsProperty: '_components' },
        { collectionType: 'extensiontype', type: 'extension', key: '_extensions', settingsProperty: '_extensions' },
        { collectionType: 'themetype',     type: 'theme',     key: '_theme',      settingsProperty: 'themeSettings' },
        { collectionType: 'menutype',      type: 'menu',      key: '_menu',       settingsProperty: 'menuSettings' }
      ],
      contentModelData: { extension: {}, menu: {}, theme: {} },
      globals: {}
    };
    processPlugins(memo, function(err) {
      if (err) {
        logger.log('error', err);
        return next(err);
      }
      filterSchemas(memo, function(err, schemas) {
        if (err) {
          logger.log('error', err);
          return next(err);
        }
        res.status(200).json(schemas);
      });
    });

    function processPlugins(memo, callback) {
      database.getDatabase(function(err, db) {
        // iterate through plugin types
        async.eachSeries(memo.pluginTypes, function(pluginType, outerCallback) {
          if (err) return callback(err);
          db.retrieve(pluginType.collectionType, null, function(err, results) {
            if (err) return callback(err);
            // iterate through all plugins for current type
            async.eachSeries(results, function(schema, innerCallback) {
              processPlugin(pluginType, schema, memo, innerCallback);
            }, outerCallback);
          });
        }, callback);
      }, configuration.getConfig('dbName'));
    }

    function processPlugin(pluginType, schema, memo, callback) {
      if (schema.globals) {
        processGlobals(pluginType, schema, memo);
      }
      if(pluginType.type === 'component') {
        memo.schemas[schema.component] = generateComponentProperties(schema);
        return callback();
      }
      // must be extension, component, menu or theme
      processPluginLocations(pluginType, schema, memo, callback);
    }

    function processGlobals(pluginType, schema, memo) {
      if(!memo.globals[pluginType.key]) {
        memo.globals[pluginType.key] = { type: 'object', properties: {} };
      }
      _.extend(memo.globals[pluginType.key].properties, {
        ['_' + schema[pluginType.type]]: {
          type: 'object',
          title: schema.displayName || '',
          properties: schema.globals
        }
      });
    }

    function generateComponentProperties(schema) {
      var data = helpers.cloneObject(schema);
      data.properties = helpers.cloneObject(that._contentSchemas.component.properties);
      data.properties.properties = {
        type: 'object',
        properties: helpers.cloneObject(_.omit(schema.properties, blackList))
      };
      return data;
    }

    function processPluginLocations(pPluginType, schema, memo, callback) {
      var pluginType = pPluginType.type;
      try {
        var schemaPluginLocations = schema.properties.pluginLocations.properties;
      } catch(e) { // handle undefined pluginLocations
        if(!_.isEmpty(schema.properties)) { // in case we have an empty pluginLocations
          delete schema.properties.pluginLocations;
          memo.schemas[schema[pluginType]] = schema;
        }
        return callback();
      }
      async.each(Object.keys(schemaPluginLocations), function(key, eachCallback) {
        var props = schemaPluginLocations[key].properties;
        if (!props) {
          return eachCallback();
        }
        var keys = Object.keys(props);
        // NOTE we need a single top-level object
        if(keys.length > 1) {
          return eachCallback(new Error(`Expected 1 property, found ${keys.length}`));
        }
        var typeObj = memo.contentModelData[pluginType];
        // don't overwrite an existing attribute
        if(typeObj[key] && _.intersection(Object.keys(typeObj[key]), keys).length > 0) {
          return eachCallback(new Error(`Already found ${pluginType} ${key} attribute with key ${keys[0]} (${schema.name})`));
        } else if(!typeObj) {
          memo.contentModelData[pluginType] = typeObj = {};
        }
        // NOTE this is needed to check against applied menu/theme in schemas.js
        props[keys[0]].name = schema.name;

        typeObj[key] = _.extend({}, typeObj[key], props);
        eachCallback();

      }, function(error) {
        if(error) return callback(error);
        // remove pluginLocations and store plugin schema
        delete schema.properties.pluginLocations;
        if(!_.isEmpty(schema.properties)) {
          memo.schemas[schema[pluginType]] = schema;
        }
        callback();
      });
    }

    function filterSchemas(memo, callback) {
      var filteredSchemas = {};
      async.each(Object.keys(memo.schemas), function(key, callback) {
        var schema = memo.schemas[key];
        try { // Append plugin globals to the course schema
          if (key === 'course' && schema.properties._globals.properties) {
            _.extend(schema.properties._globals.properties, memo.globals);
          }
        } catch(e) { // no globals, but no need to do anything
        }
        async.each(memo.pluginTypes, function(plugin, cb) {
          var pluginType = plugin.type;
          var memoData = memo.contentModelData[pluginType] && memo.contentModelData[pluginType][key] || {};
          // FIXME #2025: components are treated differently
          if(schema._doc && schema._doc.component && schema.properties[plugin.settingsProperty]) {
            memoData = Object.assign({}, memo.contentModelData[pluginType].component, memoData);
          }
          if(_.isEmpty(memoData)) {
            return cb();
          }
          // define settings property if not present in legacy schema
          if (!schema.properties[plugin.settingsProperty]) {
            schema.properties[plugin.settingsProperty] = { type: 'object' };
          }
          schema.properties[plugin.settingsProperty].properties = memoData;
          cb();

        }, function(err) { // remove any blacklisted properties
          filteredSchemas[key] = _.omit(_.pick(schema, 'properties').properties, blackList);
          callback();
        });
      }, function(err) {
        callback(err, filteredSchemas);
      });
    }
  });

  // creation
  rest.post('/content/:type', function (req, res, next) {
    var type = req.params.type;
    var val = req.body;
    val.createdBy = req.user._id;

    if (!val || 'object' !== typeof val) {
      res.statusCode = 400;
      return res.json({ success: false, message: 'request body was not a valid object' });
    }

    that.create(type, val, function (error, result) {
      if (error) {
        res.statusCode = error instanceof ContentTypeError ? 400 : 500;
        return res.json({ success: false, message: error.message });
      }

      res.statusCode = 200;
      return res.json(result);
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
        return res.json({success: false, message: error.message});
      }

      if (type !== 'component') {
        // @TODO - we need to filter resources according to permissions!
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.statusCode = 200;
        return res.json(results);
      } else {
        // Retrieve the componenttype and append component name

        database.getDatabase(function (err, db) {
          if (err) {
            return next(err);
          }

          db.retrieve('componenttype', {}, function (err, componentTypes) {
            if (error) {
              res.statusCode = error instanceof ContentTypeError ? 400 : 500;
              return res.json({success: false, message: error.message});
            }

            var processedComponents = [];

            async.each(results, function(component, callback) {

              var match = _.find(componentTypes, function(componentType) {
                // Match on the componentType.component/component._component properties.
                return componentType.component == component._component;
              });

              component._doc._componentTypeDisplayName = (match)
                ? match.displayName
                : '';

              processedComponents.push(component);

              callback(null);
            }, function(err) {
              if (err) {
                logger.log('err', 'Unable to set componentTypeDisplayName');
              }

              res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
              res.setHeader('Pragma', 'no-cache');
              res.setHeader('Expires', '0');
              res.statusCode = 200;
              return res.json(processedComponents);
            });
          });
        }, configuration.getConfig('dbName'));
      }
    });
  });

  // query all
  rest.get('/content/:type/query', function (req, res, next) {
    var type = req.params.type; // type is expected to be singular
    var options = _.keys(req.body).length
      ? req.body
      : req.query;
    var search = options.search || {};
    var self = this;
    var orList = [];
    var andList = [];

    // convert searches to regex
    async.each(
      Object.keys(search),
      function (key, nextKey) {
        var exp = {};
        // convert strings to regex for likey goodness
        if ('string' === typeof search[key]) {
          exp[key] = new RegExp(search[key], 'i');
          orList.push(exp);
        } else {
          exp[key] = search[key];
          andList.push(exp);
        }
        nextKey();
    }, function () {
      var query = {};
      if (orList.length) {
        query.$or = orList;
      }

      if (andList.length) {
        query.$and = andList;
      }

      if (search._isShared) {
        query._isShared = true;
      }

      that.retrieve(type, query, options, function (error, results) {
        if (error) {
          if(error instanceof ContentTypeError) {
            res.status(400);
          } else if(error instanceof ContentPermissionError) {
            res.status(403);
          } else {
            res.status(500);
          }
          return res.json({ success: false, message: error.message });
        }

        // @TODO - we need to filter resources according to permissions!
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.statusCode = 200;
        return res.json(results);
      });
    });

  });

  // retrieve one
  rest.get('/content/:type/:id', function (req, res, next) {
    var type = req.params.type;
    var id = req.params.id;

    if (!id || 'string' !== typeof id) {
      res.statusCode = 400;
      return res.json({ success: false, message: 'id is required' });
    }

    // add populator
    var options = {
      populate: { tags: '_id title' }
    };

    that.retrieve(type, { _id: id }, options, function (error, results) {
      if (error) {
        res.statusCode = error instanceof ContentTypeError ? 400 : 500;
        return res.json({ success: false, message: error.message });
      }

      if (type !== 'component') {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        if (results && 1 == results.length) {
          res.statusCode = 200;
          return res.json(results[0]);
        }

        res.statusCode = 404;
        return res.json({success: false, message: 'Object not found'});

      } else {
        var component;

        if (results && 1 == results.length) {
          component = results[0];
        }

        if (component) {
          database.getDatabase(function (err, db) {
            if (err) {
              return next(err);
            }

             // Get the component
            db.retrieve('componenttype', {_id: component._componentType}, function (err, componentType) {
              if (error) {
                logger.log('error', error);

                res.statusCode = 500;
                return res.json({success: false, message: error.message});
              }

              component.componentTypeDisplayName = componentType.displayName;

              res.statusCode = 200;
              return res.json(component);
            });
          }, configuration.getConfig('dbName'));
        } else {
          res.statusCode = 404;
          return res.json({success: false, message: 'Component not found'});
        }
      }
    });
  });

  // update one
  rest.put('/content/:type/:id', function (req, res, next) {
    var type = req.params.type;
    var id = req.params.id;
    var val = req.body;
    if (!val || 'object' !== typeof val) {
      res.statusCode = 400;
      return res.json({ success: false, message: 'request body was not a valid object' });
    }

    // @TODO - we need to check permissions!
    that.update(type, { _id: id }, val, function (error, updatedDocument) {
      if (error) {
        res.statusCode = error instanceof ContentTypeError ? 400 : 500;
        return res.json({ success: false, message: error.message });
      }

      res.statusCode = 200;
      return res.json({ success: true });
    });
  });

  // update one
  rest.put('/content/:type/switch/:id/:switchid', function (req, res, next) {
    var type = req.params.type;
    var id = req.params.id;
    var switchId = req.params.switchid;
    var val = req.body.newLayout;
    var switchVal = req.body.siblingLayout;

    if ((!val || 'object' !== typeof val) && (!switchVal || 'object' !== typeof switchVal)) {
      res.statusCode = 400;
      return res.json({ success: false, message: 'request body was not a valid object' });
    }

    // @TODO - we need to check permissions!
    that.update(type, { _id: id }, val, function (error, updatedDocument) {
      if (error) {
        res.statusCode = error instanceof ContentTypeError ? 400 : 500;
        return res.json({ success: false, message: error.message });
      }

      that.update(type, { _id: switchId }, switchVal, function (error, updatedDocument) {
        if (error) {
          // rollback first update call
          val._layout = (val._layout == 'left') ? 'right' : 'left';
          that.update(type, { _id: id }, val, function (error, updatedDocument) {
            if (error) {
              logger.log('error', error);
            }
          });

          res.statusCode = error instanceof ContentTypeError ? 400 : 500;
          return res.json({ success: false, message: error.message });
        }

        res.statusCode = 200;
        return res.json({ success: true });
      });

    });
  });

  // delete one
  rest.delete('/content/:type/:id', function (req, res, next) {
    var type = req.params.type;
    var id = req.params.id;

    if (!id || 'string' !== typeof id) {
      res.statusCode = 400;
      return res.json({ success: false, message: 'id is required' });
    }

    that.destroy(type, { _id: id }, function (error) {
      if (error) {
        res.statusCode = error instanceof ContentTypeError ? 400 : 500;
        return res.json({success: false, message: error.message});
      }

      res.statusCode = 200;
      return res.json({ success: true });
    });
  });

  // APIs for server-side copy and paste
  rest.post('/content/clipboard/copy', function(req, res, next) {
    var user = app.usermanager.getCurrentUser();
    var tenantId = user.tenant && user.tenant._id;
    var id = req.body.objectId;
    var referenceType = req.body.referenceType;
    var courseId = req.body.courseId;
    var contentObjects = [];
    var articles = [];
    var blocks = [];
    var components = [];
    var isMenu  = false;
    var clipboardId;

    database.getDatabase(function (error, db) {
      if (error) {
        return res.status(500).json({ success: false, message: 'Unable to connect to database' });
      }
      async.series([
        // Remove any existing clipboards for this user
        function(callback) {
          db.destroy('clipboard', {createdBy: user._id}, function (error) {
            if(error) {
              logger.log('error', error);
              return callback('Unable to remove existing clipboard record');
            }
            callback();
          });
        },
        // Retrieve the current object
        function(callback) {
          db.retrieve(referenceType, { _id: id }, function (error, results) {
            if (error) {
              return callback(error);
            }
            if (results.length > 1) {
              return callback('More results expected while copying object');
            }
            var item = results[0]._doc;

            switch (referenceType) {
              case 'contentobject':
                isMenu = (item._type == 'menu') ? true : false;
                contentObjects.push(item);
                break;
              case 'article':
                articles.push(item);
                break;
              case 'block':
                blocks.push(item);
                break;
              case 'component':
                components.push(item);
                break;
            }
            callback();
          });
        },
        // Process articles
        function(callback) {
          if(contentObjects.length !== 1 || isMenu) {
            return callback();
          }
          db.retrieve('article', { _parentId: contentObjects[0]._id }, function(error, results) {
            if (error) {
              return callback(error);
            }
            async.eachSeries(results, function(result, cb) {
              articles.push(result._doc);
              cb();
            }, callback);
          });
        },
        // Process blocks
        function(callback) {
          if(articles.length === 0 || isMenu) {
            return callback();
          }
          async.eachSeries(articles, function(article, cb) {
            db.retrieve('block', { _parentId: article._id }, function(error, results) {
              if (error) {
                return cb(error);
              }
              async.eachSeries(results, function(result, cb2) {
                blocks.push(result._doc);
                cb2();
              }, cb);
            });
          }, callback);
        },
        // Process components
        function(callback) {
          if (blocks.length === 0 || isMenu) {
            return callback();
          }
          async.eachSeries(blocks, function(block, cb) {
            db.retrieve('component', { _parentId: block._id }, function(error, results) {
              if (error) {
                return callback(error);
              }
              async.eachSeries(results, function(result, cb2) {
                components.push(result._doc);
                cb2();
              }, cb);
            });
          }, callback);
        },
        // Insert the clipboard record
        function(callback) {
          var clipboard = {
            _courseId: courseId,
            _tenantId: tenantId,
            createdBy: user._id,
            referenceType: referenceType,
            contentobject: contentObjects,
            article: articles,
            block: blocks,
            component: components
          };
          db.create('clipboard', clipboard, function(error, newRecord) {
            if (error) {
              return callback(error);
            }
            clipboardId = newRecord._id.toString();
            callback();
          });
        }
      ], function(err) {
        if (err) {
          logger.log('error', err);
          return res.status(500).json({ success: false, message: 'Error adding clipboard data' });
        }
        res.status(200).json({ success: true, message: 'ok', clipboardId: clipboardId });
      });
    });
  });

  rest.post('/content/clipboard/paste', function(req, res, next) {
    var user = app.usermanager.getCurrentUser();
    var tenantId = user.tenant && user.tenant._id;
    var id = req.body.objectId;
    var parentId = req.body.parentId;
    var layout = req.body.layout;
    var sortOrder = req.body.sortOrder;
    var courseId = req.body.courseId;
    var clipboard;
    var parentObject;
    var keyMap = {
      ContentObject: 'contentobject',
      Article: 'article',
      Block: 'block',
      Component: 'component'
    };
    var parentRelationship = {
      'contentobject': 'contentobject',
      'article': 'contentobject',
      'block': 'article',
      'component': 'block'
    };
    var map = {};

    database.getDatabase(function (error, db) {
      if (error) {
        return res.status(500).json({ success: false, message: 'Unable to connect to database' });
      }

      // Retrieve the clipboard
      db.retrieve('clipboard', {id: id, createdBy: user._id}, function(error, results) {
        if (error) {
          return res.status(500).json({ success: false, message: 'Clipboard data not found' });
        }

        if (results.length !== 1) {
          return res.status(500).json({ success: false, message: 'More than one clipboard found' });
        }

        clipboard = results[0]._doc;

        if (layout && clipboard[keyMap.Component].length == 1) {
          // Persist the component layout when there is only one
          clipboard[keyMap.Component][0]._layout = layout;
        }
        // OK to proceed
        async.series([
          function(callback) {
            // Get the parent object
            db.retrieve(parentRelationship[clipboard.referenceType], { _id: parentId }, function(error, results) {
              if (error) {
                return callback(error);
              }
              if (results.length === 1) {
                parentObject = results[0]._doc;
                return callback();
              }
              if (clipboard.referenceType === keyMap.ContentObject
                && (clipboard[keyMap.ContentObject][0]._courseId.toString() === clipboard._courseId.toString())) {
                // Handle if this is a root-level page
                parentObject = { _id: clipboard._courseId };
                callback();
              } else {
                return callback('More than one parent found');
              }
            });
          },
          // Set the sort order
          function(callback) {
            if (clipboard[clipboard.referenceType].length === 1 && sortOrder) {
              clipboard[clipboard.referenceType][0]._sortOrder = sortOrder;
            }
            callback();
          },
          function(callback) {
            async.eachSeries([
              keyMap.ContentObject,
              keyMap.Article,
              keyMap.Block,
              keyMap.Component
            ], function(level, cb) {
              map[level] = {};
              async.eachSeries(clipboard[level], function(item, cb2) {
                map[level][item._id.toString()] = null;
                cb2();
              }, function(err) { if (err) logger.log('error', error); });
              cb();
            }, callback);
          },
          // Pasting contentObjects
          function(callback) {
            if (clipboard[keyMap.ContentObject].length === 0) {
              return callback();
            }
            async.eachSeries(clipboard[keyMap.ContentObject], function(item, cb) {
              var previousId = item._id.toString();
              var previousParentId = item._parentId.toString();
              var mappedId = map[keyMap.ContentObject][previousParentId];
              var newParentId = mappedId ? mappedId : parentObject._id;

              delete item._id;
              item._parentId = newParentId;

              that.create(keyMap.ContentObject, item, function (error, newItem) {
                if (error) {
                  return cb(error);
                }
                map[keyMap.ContentObject][previousId] = newItem._id;
                // For each object being copied we should find out if there's any course assets
                // associated with the object. Then create new ones based upon there new ids
                copyCourseAssets(that, {
                  previousId: previousId,
                  newId: newItem._id,
                  previousParentId: previousParentId,
                  newParentId: newParentId
                }, cb);
              });
            }, callback);
          },
          // Pasting articles
          function(callback) {
            if (clipboard[keyMap.Article].length === 0) {
              return callback();
            }
            async.eachSeries(clipboard[keyMap.Article], function(item, cb) {
              var previousId = item._id.toString();
              var previousParentId = item._parentId.toString();
              var newParentId = typeof(map[keyMap.ContentObject][previousParentId]) !== 'undefined' && map[keyMap.ContentObject][previousParentId] != null
                                ? map[keyMap.ContentObject][previousParentId]
                                : parentObject._id;

              delete item._id;
              item._parentId = newParentId;

              that.create('article', item, function(error, newItem) {
                if (error) {
                  return cb(error);
                }
                map[keyMap.Article][previousId] = newItem._id;
                // For each object being copied we should find out if there's any course assets
                // associated with the object. Then create new ones based upon there new ids
                copyCourseAssets(that, {
                  previousId: previousId,
                  newId: newItem._id,
                  previousParentId: previousParentId,
                  newParentId: newParentId
                }, cb);
              });
            }, callback);
          },
          // Pasting blocks
          function(callback) {
            if (clipboard[keyMap.Block].length === 0) {
              return callback();
            }
            async.eachSeries(clipboard[keyMap.Block], function(item, cb) {
              var previousId = item._id.toString();
              var previousParentId = item._parentId.toString();
              var newParentId = typeof(map[keyMap.Article][previousParentId]) !== 'undefined'
                                ? map[keyMap.Article][previousParentId]
                                : parentObject._id;

              delete item._id;
              item._parentId = newParentId;

              that.create('block', item, function (error, newItem) {
                if (error) {
                  return cb(error);
                }
                map[keyMap.Block][previousId] = newItem._id;
                // For each object being copied we should find out if there's any course assets
                // associated with the object. Then create new ones based upon there new ids
                copyCourseAssets(that, {
                  previousId: previousId,
                  newId: newItem._id,
                  previousParentId: previousParentId,
                  newParentId: newParentId
                }, cb);
              });
            }, callback);
          },
          // Pasting components
          function(callback) {
            if (clipboard[keyMap.Component].length === 0) {
              return callback();
            }
            async.eachSeries(clipboard[keyMap.Component], function(item, cb) {
              var previousId = item._id.toString();
              var previousParentId = item._parentId.toString();
              var newParentId = typeof(map[keyMap.Block][previousParentId]) !== 'undefined'
                                ? map[keyMap.Block][previousParentId]
                                : parentObject._id;

              delete item._id;
              item._parentId = newParentId;

              that.create('component', item, function(error, newItem) {
                if (error) {
                  return cb(error);
                }
                map[keyMap.Component][previousId] = newItem._id;
                // For each object being copied we should find out if there's any course assets
                // associated with the object. Then create new ones based upon there new ids
                copyCourseAssets(that, {
                  previousId: previousId,
                  newId: newItem._id,
                  previousParentId: previousParentId,
                  newParentId: newParentId
                }, cb);
              });
            }, callback);
          }
        ], function(err) {
          if (err) {
            logger.log('error', err);
            return res.status(500).json({ success: false, message: 'Error pasting clipboard data' });
          }
          // successful paste, remove entry
          db.destroy('clipboard', { id: id }, function(error) {
            var newId = _.values(map[_.find(Object.keys(map), function(key) { return !_.isEmpty(map[key]); })])[0];
            return res.status(200).json({ _id: newId });
          });
        });
      }, tenantId);
    });
  });
};

/**
 * adds a schema to the collection of content schemas for enumeration
 *
 * @param {string} modelName
 * @param {object} schema
 */

ContentManager.prototype.addContentSchema = function (modelName, schema) {
  if (!this._contentSchemas[modelName]) {
    this._contentSchemas[modelName] = schema;
  }
};

/**
 * listener for database creation hooks
 * @param {object} db - the database that was created
 * @param {callback} next
 */
ContentManager.prototype.onDatabaseCreated = function (db, next) {
  var self = this;
  var pluginManager = pluginmanager.getManager();
  pluginManager.getPlugin('content', function (error, plugins) {
    async.eachSeries(
      Object.keys(plugins),
      function (key, cb) {
        self.getContentPlugin(key, function (error, contentPlugin) {
          if (error) {
            logger.log('error', 'Failed to load content plugin of type: ' + key, error);
            return cb(error);
          }

          return contentPlugin.onDatabaseCreated(db, cb);
        });
      },
      function (err) {
        next(null);
      });
  });
};

/*
* Add CRUD wrappers
* 1. Call 'pre' hooks
* 2. Call CRUD function on content plugin
* 3. Call `post` hooks
*/
["create", "retrieve", "update", "destroy"].forEach( function (el, index, array) {
  ContentManager.prototype[el] = function () {
    var self = this;
    var args = Array.prototype.slice.call(arguments);
    var type = args.shift();
    var cb = args.pop(); // swap the original callback so we can process our 'post' type content hooks
    args.push(function (err, results) {
      if (err) {
        return cb(err);
      }
      self.processContentHooks(el, type, results, { when : 'post' }, function (err, transformedResults) {
        cb(err, transformedResults);
      });
    });

    type = type && type.toLowerCase(); // all content type names are lowercase!
    // process 'pre' type hooks before CRUD
    self.processContentHooks(el, type, args, function (error, transformedArgs) {
      if (error) {
        return cb(error);
      }
      self.getContentPlugin(type, function (error, contentPlugin) {
        if (error) {
          return cb(error);
        }
        contentPlugin[el].apply(contentPlugin, transformedArgs);
      });
    });
  };
});

function copyCourseAssets(db, data, callback) {
  // Data coming in
  /*
  previousId: previousId,
  newId: newItem._id,
  previousParentId: previousParentId,
  newParentId: newParentId
  */

  db.retrieve('courseasset', {_contentTypeId: data.previousId}, function(err, courseAssets) {
    if (err) return callback(err);
    if (courseAssets.length === 0) {
      return callback();
    }

    async.each(courseAssets, function(courseAsset, callback) {
      // Converting to object here stops the original reference to a mongoose model
      var courseAsset = courseAsset.toObject();
      // Delete old _id so create will actually create
      delete courseAsset._id;
      // Set new id and parentId
      courseAsset._contentTypeId = data.newId;
      courseAsset._contentTypeParentId = data.newParentId;

      db.create('courseasset', courseAsset, function(err, newCourseAsset) {
        if (err) return callback(err);
        callback();
      })
    }, function(err) {
      if (err) return callback(err);
      callback();
    });
  });

}

exports = module.exports = {

  // expose the content manager constructor
  ContentManager : ContentManager,

  // expose the content plugin constructor
  ContentPlugin  : ContentPlugin,

  // expose errors
  errors: {
    ContentTypeError: ContentTypeError,
    ContentPermissionError: ContentPermissionError
  },


  /**
   * preload function
   *
   * @param {object} app - the Origin instance
   * @return {object} preloader - a ModulePreloader
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
          if(modloaded === WAITFOR) {
            app.contentmanager = instance;
            instance.setupRoutes();
            instance.loadContentPlugins(function () {
              database.addDatabaseHook('create', instance.onDatabaseCreated.bind(instance));
              preloader.emit('preloadChange', MODNAME, app.preloadConstants.COMPLETE);
            });
          }
        }
      };
  }

};
