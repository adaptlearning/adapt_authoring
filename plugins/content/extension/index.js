/**
 * Extension content plugin
 *
 */

var origin = require('../../../'),
    contentmanager = require('../../../lib/contentmanager'),
    rest = require('../../../lib/rest'),
    BowerPlugin = require('../bower'),
    ContentPlugin = contentmanager.ContentPlugin,
    ContentTypeError = contentmanager.errors.ContentTypeError,
    configuration = require('../../../lib/configuration'),
    database = require('../../../lib/database'),
    helpers = require('../../../lib/helpers'),
    logger = require('../../../lib/logger'),
    defaultOptions = require('./defaults.json'),
    bower = require('bower'),
    rimraf = require('rimraf'),
    async = require('async'),
    fs = require('fs'),
    ncp = require('ncp').ncp,
    mkdirp = require('mkdirp'),
    _ = require('underscore'),
    util = require('util'),
    path = require('path');

var bowerConfig = {
  type: 'extensiontype',
  keywords: 'adapt-extension',
  packageType: 'extension',
  srcLocation: 'extensions',
  options: defaultOptions,
  extra: [ "targetAttribute" ],
  nameList: [
    "adapt-contrib-assessment",
    "adapt-contrib-pageLevelProgress",
    "adapt-contrib-resources",
    "adapt-contrib-spoor",
    "adapt-contrib-trickle",
    "adapt-contrib-tutor"
  ],
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

  getEnabledExtensions(contentData._courseId, function (error, extensions) {
    if (error) {
      // permit content creation to continue, but log error
      logger.log('error', 'could not load extensions: ' + error.message);
      return cb(null, data);
    }

    // _extensions is undefined at this point
    contentData._extensions = {};
    extensions.forEach(function (extensionItem) {
      var schema = extensionItem.properties.pluginLocations.properties[contentType].properties; // yeesh
      var generatedObject = helpers.schemaToObject(schema, extensionItem.name, extensionItem.version, contentType);
      contentData._extensions = _.extend(contentData._extensions, generatedObject);
    });

    // assign back to passed args
    data[0] = contentData;
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
    return cb(error);
  }

  database.getDatabase(function (err, db) {
    if (err) {
      return cb(err);
    }

    // retrieves specified components for the course and either adds or deletes
    // extension properties of the passed extensionItem
    var updateComponentItems = function (componentType, schema, extensionItem, nextComponent) {
      var criteria = 'course' == componentType ? { _id : courseId } : { _courseId : courseId };
      db.retrieve(componentType, criteria, { fields: '_id _extensions _enabledExtensions' }, function (err, results) {
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
                version: extensionItem.version,
                targetAttribute: targetAttribute
              };
            }
            updatedExtensions = _.extend(updatedExtensions, generatedObject);
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
          db.update(componentType, { _id: component._id }, delta, next);
        }, nextComponent);
      });
    };

    db.retrieve('extensiontype', { _id: { $in: extensions } }, function (err, results) {
      if (err) {
        return cb(err);
      }

      async.eachSeries(results, function (extensionItem, nextItem) {
        var locations = extensionItem.properties.pluginLocations.properties;
        async.eachSeries(Object.keys(locations), function (key, nextLocation) {
          updateComponentItems(key, locations[key].properties, extensionItem, nextLocation);
        }, nextItem);
      }, cb);
    });
  });
}

/**
 * essential setup
 *
 * @api private
 */
function initialize () {
  BowerPlugin.prototype.initialize.call(null, bowerConfig);

  var app = origin();
  app.once('serverStarted', function (server) {

    // remove extensions from content collections
    // expects course ID and an array of extension id's
    rest.post('/extension/disable/:courseid', function (req, res, next) {
      var extensions = req.body.extensions;
      var courseId = req.params.courseid;

      // check if there is an object
      if (!extensions || 'object' !== typeof extensions) {
        res.statusCode = 404;
        return res.json({ success: false, message: 'extensions should be an array of ids' });
      }

      toggleExtensions(courseId, 'disable', extensions, function(error, result) {
        if (error) {
          res.statusCode = error instanceof ContentTypeError ? 400 : 500;
          return res.json({ success: false, message: error.message });
        }

        res.statusCode = 200;
        return res.json({success: true});
      });
    });

    // add extensions to content collections
    // expects course ID and an array of extension id's
    rest.post('/extension/enable/:courseid', function (req, res, next) {
      var extensions = req.body.extensions;
      var courseId = req.params.courseid;

      // check if there is an object
      if (!extensions || 'object' !== typeof extensions) {
        res.statusCode = 404;
        return res.json({ success: false, message: 'extensions should be an array of ids' });
      }

      toggleExtensions(courseId, 'enable', extensions, function(error, result) {
        if (error) {
          logger.log('info', 'error = ' + error);
          res.statusCode = error instanceof ContentTypeError ? 400 : 500;
          return res.json({ success: false, message: error.message });
        }

        res.statusCode = 200;
        return res.json({ success: true });
      });
    });
  });

  // add content creation hooks for each viable content type
  ['contentobject', 'article', 'block', 'component'].forEach(function (contentType) {
    app.contentmanager.addContentHook('create', contentType, contentCreationHook.bind(null, contentType));
  });
}

// setup extensions
initialize();

/**
 * Module exports
 *
 */

exports = module.exports = Extension;
