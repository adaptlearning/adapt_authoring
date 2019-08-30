// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
/**
 * Component content plugin
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
    logger = require('../../../lib/logger'),
    defaultOptions = require('./defaults.json'),
    bower = require('bower'),
    async = require('async'),
    fs = require('fs'),
    _ = require('underscore'),
    helpers = require('../../../lib/helpers'),
    util = require('util'),
    path = require('path');

var bowerConfig = {
  type: 'componenttype',
  keywords: 'adapt-component',
  packageType: 'component',
  srcLocation: 'components',
  options: defaultOptions,
  nameList: [],
  updateLegacyContent: function (newPlugin, oldPlugin, next) {
    database.getDatabase(function (err, db) {
      if (err) {
        return next(err);
      }

      db.retrieve('component', { _componentType: oldPlugin._id }, function (err, docs) {
        async.each(
          docs,
          function (doc, next) {
            db.update('component', { _id: doc._id }, { _componentType: newPlugin._id }, next);
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

function Component () {
  this.bowerConfig = bowerConfig;
}

util.inherits(Component, BowerPlugin);


/**
 * overrides base implementation of hasPermission
 *
 * @param {string} action
 * @param {object} a content item
 * @param {callback} next (function (err, isAllowed))
 */
Component.prototype.hasPermission = function (action, userId, tenantId, contentItem, next) {
  var self = this;

  app.contentmanager.getContentPlugin('contentobject', function (error, plugin) {
    if (error) {
      return next(error);
    }

    plugin.hasPermission(action, userId, tenantId, contentItem, function (error, isAllowed) { 
      if (error) {
        return next(error);
      }

      return next(null, isAllowed);
    });
  });
};

/**
 * implements ContentObject#getModelName
 *
 * @return {string}
 */
Component.prototype.getModelName = function () {
  return 'component';
};

/**
 * returns the plugin type identifier for this plugin
 *
 * @return {string}
 */
Component.prototype.getPluginType = function () {
  return 'componenttype';
};

/**
 * add content schema to the database via this function
 *
 * @param {object} db
 * @param {callback} next
 */
Component.prototype.onDatabaseCreated = function (db, next) {
  var self = this;
  BowerPlugin.prototype.onDatabaseCreated.call(self, db, function (err) {
    if (err) {
      return next(err);
    }

    ContentPlugin.prototype.onDatabaseCreated.call(self, db, next);
  });
};

/**
 * Overrides base.retrieve
 *
 * @param {object} search
 * @param {object} options
 * @param {callback} next
 */
Component.prototype.retrieve = function (search, options, next) {
  // shuffle params
  if ('function' === typeof options) {
    next = options;
    options = {};
  }

  ContentPlugin.prototype.retrieve.call(this, search, options, next);
};

Component.prototype.update = function (search, delta, next)  {
  var self = this;

  self.retrieve(search, function (error, docs) {
    if (error) {
      return next(error);
    }

    if (docs.length) {
      // Ensure that _courseId is included
      if (docs[0]._courseId && !delta.hasOwnProperty('_courseId')) {
        delta._courseId = docs[0]._courseId;
      }

      // Hold a reference to the component's parent (block) _id value.
      var existingParentId = docs[0]._parentId.toString();
      
      ContentPlugin.prototype.update.call(self, search, delta, function (error, doc) {
        if (error) {
          return next(error);
        }

        // HACK -- This next 'if' block is required to keep the courseasset records
        // in sync with the component's position.  This will be removed in a future
        // re-factor to the courseasset collection when we can remove _contentTypeParentId.
        // The associated issue has been logged as #821
        var latestParentId = doc._parentId.toString();

        // Check if the component has been moved.
        if (existingParentId !== latestParentId) { 
          // It has.
          database.getDatabase(function (err, db) {
            if (err) {
              return next(err);
            }

            var assetSearchCriteria = {
              _contentType: 'component', 
              _contentTypeParentId: existingParentId
            };

            db.retrieve('courseasset', assetSearchCriteria, function(error, assets) {
              if (error) {
                return next(error);
              }

              if (assets && assets.length !== 0) {
                // Iterate over each asset and change the _contentTypeParentId.
                async.each(assets, function(asset, callback) {

                  db.update('courseasset', {_id: asset._id}, {_contentTypeParentId: latestParentId}, function(err, doc) {
                    if (err) {
                      return callback(err);
                    }

                    callback(null);
                  });

                }, function(err) {
                  if (err) {
                    return next(err);
                  }

                  next(null);
                });

              } else {
                // Nothing to do.
                next(null);
              }
            });
          });
        } else {
          next(null);
        }
      });
    } else {
      next(null);
    }
  });
};

/**
 * Returns an array of course objects that use the Component with the passed id
 * @param callback
 * @param id
 */
Component.prototype.getUses = function (callback, id) {
  database.getDatabase(function (err, db) {
    if (err) {
      return callback(err);
    }

    db.retrieve('componenttype', { _id: id }, function (err, componentypes) {
      if (err) {
        return callback(err);
      }

      if (componentypes.length !== 1) {
        return callback(new Error('componenttype not found'));
      }

      db.retrieve('component', {_component : componentypes[0].component}, function (err, components) {
        if (err) {
          return callback(err);
        }

        //Group all the course ids into an array for a mongo query
        const courseIDs = [];
        for (var i = 0, len = components.length; i < len; i++) {
            if(!courseIDs.includes(components[i]._courseId)){
                courseIDs.push(components[i]._courseId);
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
  BowerPlugin.prototype.initialize.call(new Component(), bowerConfig);
}


// setup components
initialize();

/**
 * Module exports
 *
 */

exports = module.exports = Component;
