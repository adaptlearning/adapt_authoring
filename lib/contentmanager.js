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
    WAITFOR = 'pluginmanager';

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
  return path.join(configuration.serverRoot, 'plugins', 'content', this.getModelName(), 'model.schema');
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
      logger.log('error', 'could not read schema file at ' + schemaPath);
      return next(err);
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

    return db.retrieve(self.getModelName(), search, options, function (err, records) {
      if (err) {
        return next(err);
      }

      return next(null, records);
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

  if (this._contentHooks[contentType] &&
      this._contentHooks[contentType][action] &&
      this._contentHooks[contentType][action][options.when]) {
    return async.map(
      this._contentHooks[contentType][action][options.when],
      function (hook, next) {
         hook(data, next);
      },
      function (err, results) {
        if (options.when == 'pre' && err) {
          return cb(err);
        }
        
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
    'menuSettings',
    '_parentId',
    '_sortOrder',
    '_supportedLayout',
    '_tenantId',
    '_theme',
    'themeSettings',
    '_trackingId',
    '_type',
    'updatedAt',
    'updatedBy',
    'externalReferences'
  ];

  // content manager handles it's own routes
  permissions.ignoreRoute(/^\/api\/content\/?.*$/);

  // retrieve all
  rest.get('/content/schema', function (req, res, next) {

    var schemas = _.clone(that._contentSchemas);
    var contentModelExtensions = {
      config: {},
      course: {},
      contentobject: {},
      article: {},
      block: {},
      component: {}
    };

    var coursePluginGlobals = {
      _components: {type: 'object', properties: {}},
      _extensions: {type: 'object', properties: {}},
      _menu: {type: 'object', properties: {}},
      _theme: {type: 'object', properties: {}}
    };

    database.getDatabase(function (err, db) {
      if (err) {
        return next(err);
      }

      var plugins = [
        {collectionType: 'componenttype', type: 'component'},
        {collectionType: 'extensiontype', type: 'extension'},
        {collectionType: 'themetype', type: 'theme'}
      ];

      async.eachSeries(plugins, function (plugin, outerCallback) {

        db.retrieve(plugin.collectionType, null, function (err, results) {
          if (err) {
            return next(err);
          }

          async.series([
            function(callback) {
              async.eachSeries(results, function (schema, processCallback) {

                if (schema.globals) {
                  var globals = schema.globals;
                  var json = [];

                  switch (plugin.type) {
                    case 'component':
                      json['_' + schema.component] = {
                        type: 'object',
                        title: schema.displayName || '',
                        properties: globals
                      };

                      _.extend(coursePluginGlobals._components.properties, json);
                      break;
                    case 'extension':
                      json['_' + schema.extension] = {
                        type: 'object',
                        title: schema.displayName || '',
                        properties: globals
                      };

                      _.extend(coursePluginGlobals._extensions.properties, json);
                      break;

                    case 'theme':
                      json['_' + schema.theme] = {
                        type: 'object',
                        title: schema.displayName || '',
                        properties: globals
                      };

                      _.extend(coursePluginGlobals._theme.properties, json);
                      break;

                    case 'menu':
                      json['_' + schema.menu] = {
                        type: 'object',
                        title: schema.displayName || '',
                        properties: globals
                      };

                      _.extend(coursePluginGlobals._menu.properties, json);
                      break;
                  }
                }

                switch (plugin.type) {
                  case 'extension':
                    // fix for issues/618 - api/content/schema breaks when malformed extension is uploaded
                    var schemaPluginLocations = schema.properties && schema.properties.pluginLocations;

                    if (!schemaPluginLocations) {
                      logger.log('warn', 'Extension "' + schema.displayName + '" does not define required attribute "pluginLocations"');
                      return processCallback();
                    }

                    async.each(Object.keys(schemaPluginLocations.properties), function(key, nestedCallback) {
                      var pluginLocations = schemaPluginLocations.properties[key];

                      // If there are any properties set push them to the correct contentModel
                      if (pluginLocations.properties) {
                        contentModelExtensions[key] = _.extend(contentModelExtensions[key], pluginLocations.properties);
                      }

                      nestedCallback();
                    }, function(err) {
                      if (err) {
                        logger.log('error', err);
                        return processCallback(err);
                      }
                    });

                    break;

                  case 'component':
                    var baseAttributes = _.clone(that._contentSchemas['component'].properties);
                    var extendedAttributes = _.clone(_.omit(schema.properties, blackList));
                    schemas[schema.component] = schema;

                    schemas[schema.component].properties = baseAttributes;

                    schemas[schema.component].properties.properties = {
                      type: 'object',
                      properties:extendedAttributes
                    };

                    break;

                  case 'theme':
                    schemas[schema.theme] = schema;

                    break;
                }

                processCallback();
              }, function (err) {
                if (err) {
                  return callback(err);
                }

                callback();
              });
            }
          ],
          function(err, results) {
            if (err) {
              return outerCallback(err);
            }

            outerCallback();
          });
        });
      }, function (err) {
        if (err) {
          logger.log('error', err);
          return next(err);
        }

        var filteredSchemas = {};

        async.each(Object.keys(schemas), function(key, callback) {
          var value = schemas[key];

          // Append plugin globals to the course schema
          if (key == 'course' && value.properties['_globals'] && value.properties['_globals'].properties) {
            _.extend(value.properties['_globals'].properties, coursePluginGlobals);
          }

          if (contentModelExtensions[key]) {
            value.properties._extensions.properties = contentModelExtensions[key];
          } else if (value.component) {
            value.properties._extensions.properties = contentModelExtensions['component'];
          }
          filteredSchemas[key] = _.omit(_.pick(value, 'properties').properties, blackList);

          callback();
        }, function(err) {
          if (err) {
            logger.log('error', err);
            return next(err);
          }

          res.statusCode = 200;
          return res.json(filteredSchemas);
        });
      }); // end async.eachSeries()

    }, configuration.getConfig('dbName')); // end getDatabase()
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
          res.statusCode = error instanceof ContentTypeError ? 400 : 500;
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

    var hierarchy = {
      'contentObjects': 'contentobject',
      'articles': 'article',
      'blocks': 'block',
      'components':'component'
    };

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
        res.statusCode = 200;
        return res.json({success: false, message: 'Unable to connect to database'});
      }

      async.series([
        function(callback) {
          // Remove any existing clipboards for this user
          db.destroy('clipboard', {createdBy: user._id}, function (error) {
            if (error) {
              logger.log('error', error);
              callback('Unable to remove existing clipboard record');
            } else {
              callback();
            }
          });
        },
        function(callback) {
          // Retrieve the current object
          var type = hierarchy[referenceType];

          db.retrieve(type, { _id: id }, function (error, results) {
            if (error) {
              return callback(error);
            }

            if (results.length === 1) {
              var item = results[0]._doc;

              switch (referenceType) {
                case 'contentObjects':
                  isMenu = (item._type == 'menu') ? true : false;
                  contentObjects.push(item);
                  break;

                case 'articles':
                  articles.push(item);
                  break;

                case 'blocks':
                  blocks.push(item);
                  break;

                case 'components':
                  components.push(item);
                  break;
              }

              callback();
            } else {
              callback('More results expected while copying object');
            }
          });
        },
        function(callback) {
          // Process articles
          if (contentObjects.length == 1 && !isMenu) {
            db.retrieve('article', {_parentId: contentObjects[0]._id}, function(error, results) {
              if (error) {
                return callback(error);
              }

              async.eachSeries(results, function(result, cb) {
                articles.push(result._doc);
                cb();
              }, function(err) {
                if (err) {
                  callback(err);
                } else {
                  // logger.log('info', 'All articles processed');
                  callback();
                }
              });
            });
          } else {
            //  A single article has been copied
            callback();
          }
        },
        function(callback) {
          // Process blocks
          if (articles.length !== 0 && !isMenu) {
            async.eachSeries(articles, function(article, cb) {
              db.retrieve('block', { _parentId: article._id }, function (error, results) {
                if (error) {
                  return cb(error);
                }

                async.eachSeries(results, function(result, cb2) {
                  blocks.push(result._doc);

                  cb2();
                }, function(err) {
                  if (err) {
                    cb(err);
                  } else {
                    // logger.log('info', 'All blocks processed');
                    cb();
                  }
                });
              });
            }, function(err) {
              if (err) {
                return callback(err);
              } else {
                callback();
              }
            });
          } else {
            callback();
          }
        },
        function(callback) {
          // Process components
          if (blocks.length !== 0 && !isMenu) {
            async.eachSeries(blocks, function(block, cb) {
              db.retrieve('component', { _parentId: block._id }, function (error, results) {
                if (error) {
                  return callback(error);
                }

                async.eachSeries(results, function(result, cb2) {
                  components.push(result._doc);

                  cb2();
                }, function(err) {
                  if (err) {
                    cb(err);
                  } else {
                    // logger.log('info', 'All components processed');
                    cb();
                  }
                });
              });
            }, function(err) {
              if (err) {
                return callback(err);
              } else {
                callback();
              }
            });
          } else {
            callback();
          }
        },
        function(callback) {
          // Insert the clipboard record
          var clipboard = {
            _courseId: courseId,
            _tenantId: tenantId,
            createdBy: user._id,
            referenceType: referenceType,
            contentObjects: contentObjects,
            articles: articles,
            blocks: blocks,
            components: components
          };

          db.create('clipboard', clipboard, function(error, newRecord) {
            if (error) {
              return callback(error);
            } else {
              clipboardId = newRecord._id.toString();
              callback();
            }
          });
        }
      ], function(err) {
        if (!err) {
          res.statusCode = 200;
          return res.json({success: true, message: 'ok', clipboardId: clipboardId});
        } else {
          logger.log('error', err);
          res.statusCode = 200;
          return res.json({success: false, message: 'Error adding clipboard data'});
        }
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

    var parentRelationship = {
      'contentObjects' : 'contentobject', // In case
      'articles' : 'contentobject',
      'blocks' : 'article',
      'components' : 'block'
    };

    var typeToCollection = {
      'page': 'contentObjects',
      'menu': 'contentObjects',
      'article': 'articles',
      'block': 'blocks',
      'component': 'components'
    }

    var map = {};

    database.getDatabase(function (error, db) {
      if (error) {
        res.statusCode = 200;
        return res.json({success: false, message: 'Unable to connect to database'});
      }

      // Retrieve the clipboard
      db.retrieve('clipboard', {id: id, createdBy: user._id}, function(error, results) {
        if (error) {
          res.statusCode = 200;
          return res.json({success: false, message: 'Clipboard data not found'});
        }

        if (results.length == 1) {
          clipboard = results[0]._doc;

          if (layout && clipboard.components.length == 1) {
            // Persist the component layout when there is only one
            clipboard.components[0]._layout = layout;
          }

          // OK to proceed
          async.series([
              function(callback) {
                // Get the parent object
                db.retrieve(parentRelationship[clipboard.referenceType], {_id: parentId}, function(error, results) {
                  if (error) {
                    callback(error);
                  }

                  if (results.length == 1) {
                    parentObject = results[0]._doc;
                    callback();
                  } else {
                    if (clipboard.referenceType == 'contentObjects'
                      && (clipboard.contentObjects[0]._courseId.toString() === clipboard._courseId.toString())) {
                      // Handle if this is a root-level page
                      parentObject = { _id: clipboard._courseId };
                      // map['contentObjects'] = {};
                      // map['contentObjects'][clipboard.contentObjects[0]._parentId.toString()] = clipboard._courseId.toString();
                      callback();
                    } else {
                      return callback('More than one parent found');
                    }
                  }
                });
              },
              function(callback) {
                // Set the sort order
                if (clipboard[clipboard.referenceType].length == 1) {
                  if (sortOrder) {
                    clipboard[clipboard.referenceType][0]._sortOrder = sortOrder;
                  }
                }

                callback();
              },

              function(callback) {
                async.eachSeries(['contentObjects', 'articles', 'blocks', 'components'], function(level, cb) {
                  map[level] = {};

                  async.eachSeries(clipboard[level], function(item, cb2) {
                    map[level][item._id.toString()] = null;
                    cb2();
                  }, function(err) {
                    if (err) {
                      logger.log('error', error);
                    }
                  });

                  cb();
                }, function(err) {
                  if (err) {
                    callback(err);
                  }

                  callback();
                });
              },
              function(callback) {
                // Pasting contentObjects
                if (clipboard['contentObjects'].length !== 0) {
                  async.eachSeries(clipboard['contentObjects'], function(item, cb) {
                    var previousId = item._id.toString();
                    var previousParentId = item._parentId.toString();
                    var newParentId = typeof(map['contentObjects'][previousParentId]) !== 'undefined' && map['contentObjects'][previousParentId] != null
                                      ? map['contentObjects'][previousParentId]
                                      : parentObject._id;

                    delete item._id;
                    item._parentId = newParentId;

                    that.create('contentobject', item, function (error, newItem) {
                      if (error) {
                        cb(error);
                      }

                      map['contentObjects'][previousId] = newItem._id;
                      // For each object being copied we should find out if there's any course assets
                      // associated with the object. Then create new ones based upon there new ids
                      copyCourseAssets(that, {
                        previousId: previousId,
                        newId: newItem._id,
                        previousParentId: previousParentId,
                        newParentId: newParentId
                      }, function(err) {
                        if (err) return cb(err);
                        cb();
                      });

                    });
                  }, function(err) {
                    if (err) {
                      callback(err);
                    }

                    callback();
                  });
                } else {
                  callback();
                }
              },
              function(callback) {
                // Pasting articles
                if (clipboard['articles'].length !== 0) {
                  async.eachSeries(clipboard['articles'], function(item, cb) {
                    var previousId = item._id.toString();
                    var previousParentId = item._parentId.toString();
                    var newParentId = typeof(map['contentObjects'][previousParentId]) !== 'undefined' && map['contentObjects'][previousParentId] != null
                                      ? map['contentObjects'][previousParentId]
                                      : parentObject._id;

                    delete item._id;
                    item._parentId = newParentId;

                    that.create('article', item, function (error, newItem) {
                      if (error) {
                        cb(error);
                      }

                      map['articles'][previousId] = newItem._id;
                      // For each object being copied we should find out if there's any course assets
                      // associated with the object. Then create new ones based upon there new ids
                      copyCourseAssets(that, {
                        previousId: previousId,
                        newId: newItem._id,
                        previousParentId: previousParentId,
                        newParentId: newParentId
                      }, function(err) {
                        if (err) return cb(err);
                        cb();
                      });

                    });
                  }, function(err) {
                    if (err) {
                      callback(err);
                    }

                    callback();
                  });
                } else {
                  callback();
                }
              },
              function(callback) {
                // Pasting blocks
                if (clipboard['blocks'].length !== 0) {
                  async.eachSeries(clipboard['blocks'], function(item, cb) {
                    var previousId = item._id.toString();
                    var previousParentId = item._parentId.toString();
                    var newParentId = typeof(map['articles'][previousParentId]) !== 'undefined'
                                      ? map['articles'][previousParentId]
                                      : parentObject._id;

                    delete item._id;
                    item._parentId = newParentId;

                    that.create('block', item, function (error, newItem) {
                      if (error) {
                        cb(error);
                      }

                      map['blocks'][previousId] = newItem._id;
                      // For each object being copied we should find out if there's any course assets
                      // associated with the object. Then create new ones based upon there new ids
                      copyCourseAssets(that, {
                        previousId: previousId,
                        newId: newItem._id,
                        previousParentId: previousParentId,
                        newParentId: newParentId
                      }, function(err) {
                        if (err) return cb(err);
                        cb();
                      });

                    });
                  }, function(err) {
                    if (err) {
                      callback(err);
                    }

                    callback();
                  });
                } else {
                  callback();
                }
              },
              function(callback) {
                // Pasting components
                if (clipboard['components'].length !== 0) {
                  async.eachSeries(clipboard['components'], function(item, cb) {
                    var previousId = item._id.toString();
                    var previousParentId = item._parentId.toString();
                    var newParentId = typeof(map['blocks'][previousParentId]) !== 'undefined'
                                      ? map['blocks'][previousParentId]
                                      : parentObject._id;

                    delete item._id;
                    item._parentId = newParentId;

                    that.create('component', item, function (error, newItem) {
                      if (error) {
                        cb(error);
                      }

                      map['components'][previousId] = newItem._id;
                      // For each object being copied we should find out if there's any course assets
                      // associated with the object. Then create new ones based upon there new ids
                      copyCourseAssets(that, {
                        previousId: previousId,
                        newId: newItem._id,
                        previousParentId: previousParentId,
                        newParentId: newParentId
                      }, function(err) {
                        if (err) return cb(err);
                        cb();
                      });

                    });
                  }, function(err) {
                    if (err) {
                      callback(err);
                    }

                    callback();
                  });
                } else {
                  callback();
                }
              }
            ], function(err) {
              if (!err) {
                res.statusCode = 200;
                return res.json({success: true, message: 'ok'});
              } else {
                logger.log('error', err);
                return res.json({success: false, message: 'Error pasting clipboard data'});
              }
            });

        } else {
          res.statusCode = 200;
          return res.json({success: false, message: 'More than one clipboard found'});
        }
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

// add CRUD wrappers
["create", "retrieve", "update", "destroy"].forEach( function (el, index, array) {
  ContentManager.prototype[el] = function () {
    var self = this;
    var callargs = arguments;
    var args = Array.prototype.slice.call(arguments);
    var type = args.shift();
    var cb = args[args.length - 1]; // swap the original callback so we can process our 'post' type content hooks
    args[args.length - 1] = function (err, results) {
      if (err) {
        return cb(err);
      }

      self.processContentHooks(el, type, results, { when : 'post' }, function (err, transformedResults) {
        return cb(err, transformedResults);
      });
    };

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

        return contentPlugin[el].apply(contentPlugin, transformedArgs);
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
