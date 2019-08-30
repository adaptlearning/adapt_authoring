// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
/**
 * Extension content plugin
 *
 */
var _ = require('underscore');
var async = require('async');
var bower = require('bower');
var fs = require('fs');
var path = require('path');
var util = require('util');

var BowerPlugin = require('../bower');
var database = require('../../../lib/database');
var configuration = require('../../../lib/configuration');
var contentmanager = require('../../../lib/contentmanager');
var helpers = require('../../../lib/helpers');
var logger = require('../../../lib/logger');
var origin = require('../../../');
var rest = require('../../../lib/rest');
var usermanager = require('../../../lib/usermanager');

var ContentPlugin = contentmanager.ContentPlugin;
var ContentTypeError = contentmanager.errors.ContentTypeError;

var defaultOptions = require('./defaults.json');

var bowerConfig = {
  type: 'extensiontype',
  keywords: 'adapt-extension',
  packageType: 'extension',
  srcLocation: 'extensions',
  options: defaultOptions,
  nameList: [],
  updateLegacyContent: function (newPlugin, oldPlugin, next) {
    database.getDatabase(function (err, db) {
      if (err) {
        return next(err);
      }

      // if updating a config, search _enabledExtenions, otherwise, _extensions
      var search = {};
      var targetAttr = '_enabledExtensions.' + oldPlugin.extension;
      search[targetAttr] = { $ne: null };
      db.retrieve('config', search, function (err, docs) {
        // for each content item, update the _extensions array
        async.each(
          docs,
          function (doc, nextItem) {
            // construct the delta
            var enabledExtensions = doc._enabledExtensions;
            Object.keys(enabledExtensions).forEach(function (key) {
              if (enabledExtensions[key]._id.toString() === oldPlugin._id.toString()) {
                enabledExtensions[key]._id = newPlugin._id;
                enabledExtensions[key].version = newPlugin.version;
              }
            });
            // run the update
            db.update('config', { _id: doc._id }, { _enabledExtensions: enabledExtensions }, nextItem);
          }, function (err) {
            if (err) {
              logger.log('error', 'Failed to update old documents: ' + err.message, err);
            }
            return next(null);
          });
      });
    });
  }
};

function Extension () {
  this.bowerConfig = bowerConfig;
}

util.inherits(Extension, BowerPlugin);

/**
 * implements ContentObject#getModelName
 *
 * @return {string}
 */
Extension.prototype.getModelName = function () {
  return 'extension';
};

/**
 *
 * @return {string}
 */
Extension.prototype.getPluginType = function () {
  return 'extensiontype';
};

/**
 * Overrides base.retrieve
 *
 * @param {object} search
 * @param {object} options
 * @param {callback} next
 */
Extension.prototype.retrieve = function (search, options, next) {
  // shuffle params
  if ('function' === typeof options) {
    next = options;
    options = {};
  }

  if (!options.populate) {
    options.populate = { '_extensionType': ['displayName'] };
  }

  ContentPlugin.prototype.retrieve.call(this, search, options, next);
};

/**
 * retrieves an array of extensiontype items that have been enabled on a particular course
 *
 * @param {string} courseId
 * @param {callback} cb
 */
function getEnabledExtensions(courseId, cb) {
  database.getDatabase(function (error, db) {
    if (error) {
      return cb(error);
    }

    // should we delegate this feature to the config plugin?
    db.retrieve('config', { _courseId: courseId }, function (error, results) {
      if (error) {
        return cb(error);
      }

      if (!results || 0 === results.length) {
        logger.log('info', 'could not retrieve config for course ' + courseId);
        return cb(null, []);
      }

      // get the extensions based on the _enabledExtensions attribute
      var extIds = [];
      var enabledExtensions = results[0]._enabledExtensions;
      enabledExtensions && Object.keys(enabledExtensions).forEach(function (key) {
        extIds.push(enabledExtensions[key]._id);
      });
      db.retrieve('extensiontype', { _id: { $in: extIds } }, cb);
    });
  });
}

function contentDeletionHook(contentType, data, cb) {
  var contentData = data[0];

  if (!contentData._id) {
    return cb(null, data);
  }

  // TODO - Check if this is the last component and remove globals?
  return cb(null, data);
}
/**
 * hook to modify a newly created content item based on enabled extensions for a course
 *
 * @param {string} contentType
 * @param {array} data
 * @param {callback} cb
 */
function contentCreationHook (contentType, data, cb) {
  // in creation, data[0] is the content
  var contentData = data[0];
  if (!contentData._courseId) {
    // cannot do anything for unknown courses
    return cb(null, data);
  }

  // Start the async bit
  async.series([
    function(callback) {
      if (contentType == 'component') {
        // Check that any globals for this component are set
        database.getDatabase(function (error, db) {
          if (error) {
            return callback(error);
          }

          db.retrieve('componenttype', {component: contentData._component}, function(err, results) {
            if (err) {
              return callback(err);
            }

            if (!results || results.length == 0) {
              return callback('Unexpected number of componentType records');
            }

            var componentType = results[0]._doc;

            if (componentType.globals) {
              // The component has globals.
              database.getDatabase(function(error, tenantDb) {
                // Add the globals to the course.
                tenantDb.retrieve('course', { _id: contentData._courseId }, function(err, results) {
                  if (err) {
                    return callback(err);
                  }

                  var key = '_' + componentType.component;
                  var courseDoc = results[0]._doc;
                  var courseGlobals = courseDoc._globals
                    ? courseDoc._globals
                    : {};

                  // Create the _components global object.
                  if (!courseGlobals._components) {
                    courseGlobals._components = {};
                  }

                  if (!courseGlobals._components[key]) {
                    // The global JSON does not exist for this component so set the defaults.
                    var componentGlobals = {};

                    for (var prop in componentType.globals) {
                      if (componentType.globals.hasOwnProperty(prop)) {
                        componentGlobals[prop] = componentType.globals[prop].default;
                      }
                    }

                    courseGlobals._components[key] = componentGlobals;

                    tenantDb.update('course', { _id: contentData._courseId }, { _globals: courseGlobals }, function(err, doc) {
                      if (err) {
                        return callback(err);
                      } else {
                        return callback(null);
                      }
                    });
                  } else {
                    return callback(null);
                  }
                });
              });
            } else {
              return callback(null)
            }
          });
        }, configuration.getConfig('dbName'));
      } else {
        return callback(null);
      }
    },
    function(callback) {
      getEnabledExtensions(contentData._courseId, function(error, extensions) {
        if (error) {
          // permit content creation to continue, but log error
          logger.log('error', 'could not load extensions: ' + error.message);
          return callback(null);
        }

        // create _extensions if we need it
        if(!contentData._extensions) contentData._extensions = {};
        extensions.forEach(function(extensionItem) {
          if (extensionItem.properties.hasOwnProperty('pluginLocations') && extensionItem.properties.pluginLocations.properties[contentType]) {
            var schema = extensionItem.properties.pluginLocations.properties[contentType].properties; // yeesh
            var generatedObject = helpers.schemaToObject(schema, extensionItem.name, extensionItem.version, contentType);
            // keep any existing values in place
            contentData._extensions = _.defaults(contentData._extensions, generatedObject);
          }
        });

        // assign back to passed args
        data[0] = contentData;
        callback(null);
      });
    }
  ],
  function(err, results) {
    if (err) {
      logger.log('error', err);
      return cb(err);
    }

    return cb(null, data);
  });
}

/**
 * async loop through extensions, add/remove extension JSON from content
 *
 * @params courseId {string}
 * @params action {string}
 * @params extensions {object} [extension IDs]
 * @param {callback} cb
*/

function toggleExtensions (courseId, action, extensions, cb) {
  if (!extensions || 'object' !== typeof extensions) {
    return cb(new Error('Incorrect parameters passed'));
  }

  var user = usermanager.getCurrentUser();

  if (user && user.tenant && user.tenant._id) {
    // Changes to extensions warrants a full course rebuild
    app.emit('rebuildCourse', user.tenant._id, courseId);
  }

  database.getDatabase(function (err, db) {
    if (err) {
      return cb(err);
    }

    // retrieves specified components for the course and either adds or deletes
    // extension properties of the passed extensionItem
    var updateComponentItems = function (tenantDb, componentType, schema, extensionItem, nextComponent) {
      var criteria = 'course' == componentType ? { _id : courseId } : { _courseId : courseId };
      tenantDb.retrieve(componentType, criteria, { fields: '_id _extensions _enabledExtensions' }, function (err, results) {
        if (err) {
          return cb(err);
        }

        var generatedObject = helpers.schemaToObject(schema, extensionItem.name, extensionItem.version, componentType);
        var targetAttribute = extensionItem.targetAttribute;
        // iterate components and update _extensions attribute
        async.each(results, function (component, next) {
          var isConfig = ('config' == componentType);
          var updatedExtensions = component._extensions || {};
          var enabledExtensions = component._enabledExtensions || {};
          if ('enable' == action) {
            // we need to store extra in the config object
            if (isConfig) {
              enabledExtensions[extensionItem.extension] = {
                _id: extensionItem._id,
                name: extensionItem.name,
                version: extensionItem.version,
                targetAttribute: targetAttribute
              };
            }

            if (generatedObject) {
              updatedExtensions = _.extend(updatedExtensions, generatedObject);
            }
          } else {
            // remove from list of enabled extensions in config object
            if (isConfig) {
              delete enabledExtensions[extensionItem.extension];
            }

            generatedObject && (delete updatedExtensions[targetAttribute]);
          }

          // update using delta
          var delta = { _extensions : updatedExtensions };
          if (isConfig) {
            delta._enabledExtensions = enabledExtensions;
          }

          tenantDb.update(componentType, { _id: component._id }, delta, next);
        }, nextComponent);
      });
    };

    db.retrieve('extensiontype', { _id: { $in: extensions } }, function (err, results) {
      if (err) {
        return cb(err);
      }

      // Switch to the tenant database
      database.getDatabase(function(err, tenantDb) {
        if (err) {
          logger.log('error', err);
          return cb(err);
        }

        // Iterate over all the extensions
        async.eachSeries(results, function (extensionItem, nextItem) {
          var locations = extensionItem.properties.pluginLocations.properties;

          // Ensure that the 'config' key always exists, as this is required
          // to presist the list of enabled extensions.
          if (!_.has(locations, 'config')) {
            locations.config = {};
          }

          if (extensionItem.globals) {
            tenantDb.retrieve('course', { _id: courseId }, function (err, results) {
              if (err) {
                return cb(err);
              }

              var courseDoc = results[0]._doc;
              var key = '_' + extensionItem.extension;
              // Extract the global defaults
              var courseGlobals = courseDoc._globals
                ? courseDoc._globals
                : {};

              if (action == 'enable') {
                // Add default value and
                if (!courseGlobals._extensions) {
                  courseGlobals._extensions = {};
                }

                if (!courseGlobals._extensions[key]) {
                  // The global JSON does not exist for this extension so set the defaults
                  var extensionGlobals = {};

                  for (var prop in extensionItem.globals) {
                    if (extensionItem.globals.hasOwnProperty(prop)) {
                      extensionGlobals[prop] = extensionItem.globals[prop].default;
                    }
                  }

                  courseGlobals._extensions[key] = extensionGlobals;
                }
              } else {
                // Remove any references to this extension from _globals
                if (courseGlobals._extensions && courseGlobals._extensions[key]) {
                  delete courseGlobals._extensions[key];
                }
              }

              tenantDb.update('course', { _id: courseId }, { _globals: courseGlobals }, function(err, doc) {
                if (!err) {
                  async.eachSeries(Object.keys(locations), function (key, nextLocation) {
                    updateComponentItems(tenantDb, key, locations[key].properties, extensionItem, nextLocation);
                  }, nextItem);
                }
              });
            });
          } else {
            async.eachSeries(Object.keys(locations), function (key, nextLocation) {
              updateComponentItems(tenantDb, key, locations[key].properties, extensionItem, nextLocation);
            }, nextItem);
          }
        }, function(err) {
          if (err) {
            cb(err);
          } else {
            // The results array should only ever contain one item now, but using a FOR loop just in case.
            for (var i = 0; i < results.length; i++) {
              // Trigger an event to indicate that the extension has been enabled/disabled.
              app.emit(`extension:${action}`, results[0].name, user.tenant._id, courseId, user._id);
            }

            cb();
          }
        });
      });

    });
  }, configuration.getConfig('dbName'));
}

function enableExtensions(courseId, extensions, cb) {
  if(!extensions || 'object' !== typeof extensions) {
    return cb(new Error('Extensions should be an array of ids'));
  }
  toggleExtensions(courseId, 'enable', extensions, function(error, result) {
    if(error) {
      return cb(error);
    }
    cb();
  });
}

function disableExtensions(courseId, extensions, cb) {
  if(!extensions || 'object' !== typeof extensions) {
    return cb(new Error('Extensions should be an array of ids'));
  }
  toggleExtensions(courseId, 'disable', extensions, function(error, result) {
    if(error) {
      return cb(error);
    }
    cb();
  });
}

/**
 * Returns an array of course objects that use the Extension with the passed id
 * @param callback
 * @param id
 */
Extension.prototype.getUses = function (callback, id) {
  database.getDatabase(function (err, db) {
    if (err) {
      return callback(err);
    }

    db.retrieve('extensiontype', { _id: id }, function (err, extensiontypes) {
      if (err) {
        return callback(err);
      }

      if (extensiontypes.length !== 1) {
        return callback(new Error('extensiontype not found'));
      }

      const search = {};
      search["_enabledExtensions." + extensiontypes[0].extension] = { $exists: true };
      db.retrieve('config', search, function (err, configs) {
        if (err) {
          return callback(err);
        }

        //Group all the course ids into an array for a mongo query
        const courseIDs = [];
        for (var i = 0, len = configs.length; i < len; i++) {
          if(!courseIDs.includes(configs[i]._courseId)) {
            courseIDs.push(configs[i]._courseId)      ;
          }
        }

        db.retrieve('course', { _id: {$in: courseIDs} }, callback);
      });
    });
  });
};

/**
 * essential setup
 *
 * @api private
 */
function initialize () {
  BowerPlugin.prototype.initialize.call(new Extension(), bowerConfig);

  var app = origin();

  app.on('extensions:enable', enableExtensions);
  app.on('extensions:disable', disableExtensions);

  app.once('serverStarted', function (server) {

    // remove extensions from content collections
    // expects course ID and an array of extension id's
    rest.post('/extension/disable/:courseid', function (req, res, next) {
      disableExtensions(req.params.courseid, req.body.extensions, function(error) {
        if(error) {
          logger.log('error', error);
          return res.status(error instanceof ContentTypeError ? 400 : 500).json({ success: false, message: error });
        }
        res.status(200).json({ success: true });
      });
    });

    // add extensions to content collections
    // expects course ID and an array of extension id's
    rest.post('/extension/enable/:courseid', function (req, res, next) {
      enableExtensions(req.params.courseid, req.body.extensions, function(error) {
        if(error) {
          logger.log('error', error);
          return res.status(error instanceof ContentTypeError ? 400 : 500).json({ success: false, message: error });
        }
        res.status(200).json({ success: true });
      });
    });
  });
  // HACK surface this properly somewhere
  app.contentmanager.toggleExtensions = toggleExtensions;

  // add content creation hooks for each viable content type
  ['contentobject', 'article', 'block', 'component'].forEach(function (contentType) {
    app.contentmanager.addContentHook('create', contentType, contentCreationHook.bind(null, contentType));
  });

  ['component'].forEach(function(contentType) {
    app.contentmanager.addContentHook('destroy', contentType, contentDeletionHook.bind(null, contentType));
  });
}

// setup extensions
initialize();

/**
 * Module exports
 *
 */

exports = module.exports = Extension;
