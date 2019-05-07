// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
/**
 * Course Content plugin type
 */

var contentmanager = require('../../../lib/contentmanager'),
    tenantmanager = require('../../../lib/tenantmanager'),
    ContentPlugin = contentmanager.ContentPlugin,
    ContentPermissionError = contentmanager.errors.ContentPermissionError,
    configuration = require('../../../lib/configuration'),
    permissions = require('../../../lib/permissions'),
    usermanager = require('../../../lib/usermanager'),
    util = require('util'),
    path = require('path'),
    async = require('async'),
    origin = require('../../../'),
    rest = require('../../../lib/rest'),
    _ = require('underscore'),
    logger = require('../../../lib/logger'),
    database = require('../../../lib/database'),
    helpers = require('../../../lib/helpers'),
    usermanager = require('../../../lib/usermanager');


function CourseContent () {
}

util.inherits(CourseContent, ContentPlugin);

var DASHBOARD_COURSE_FIELDS = [
    '_id', '_tenantId', '_type', '_isShared', 'title', 'heroImage',
    'updatedAt', 'updatedBy', 'createdAt', 'createdBy', 'tags', '_shareWithUsers'
];

function doQuery(req, res, andOptions, next) {
  if(!next) {
    next = andOptions;
    andOptions = [];
  }
  const options = Object.assign({}, req.body, req.query);
  options.search = Object.assign({}, req.body.search, req.query.search);
  const search = options.search || {};
  const self = this;
  const orList = [];
  const andList = [];
  // convert searches to regex
  async.each(Object.keys(search), function (key, nextKey) {
    // Convert string -> regex, special case $or should be within $and
    if ('string' === typeof search[key] && key !== "$or") {
      orList.push({ [key]: new RegExp(search[key], 'i') });
    } else {
      andList.push({ [key]: search[key] });
    }
    nextKey();
  }, function () {
    const query = {};

    if (orList.length) query.$or = orList;
    if(andList.length || andOptions.length) query.$and = andList.concat(andOptions);

    options.fields = DASHBOARD_COURSE_FIELDS.join(' ');
    options.populate = Object.assign({ 'createdBy': 'email firstName lastName' }, options.populate);
    options.jsonOnly = true;

    new CourseContent().retrieve(query, options, function (err, results) {
      if (err) {
        return res.status(500).json(err);
      }
      return res.status(200).json(results);
    });
  });
}
/**
 * essential setup
 *
 * @api private
 */
function initialize () {
  var self = this;
  var app = origin();
  app.once('serverStarted', function(server) {
    // force search to use only courses created by current user
    rest.get('/my/course', (req, res, next) => doQuery(req, res, [{ createdBy: req.user._id }], next));
    // Only return courses which have been shared
    rest.get('/shared/course', (req, res, next) => {
      req.body.search = Object.assign({}, req.body.search, { $or: [{ _shareWithUsers: req.user._id }, { _isShared: true }] });
      doQuery(req, res, next);
    });
    /**
     * API Endpoint to duplicate a course
     *
     * @fires ~courseDuplicated
     */
    // add course duplicate route - @TODO - Restrict access to this!
    rest.get('/duplicatecourse/:id', function (req, res, next) {
      duplicate({_id: req.params.id}, function (error, newCourse) {
        if (error) {
          res.statusCode = 400;
          return res.json({success: false, message: error.message});
        }
        /**
         * @event courseDuplicated
         * @type object
         */
        app.emit('courseDuplicated', newCourse);
        res.statusCode = 200;
        return res.json({success: true, newCourseId: newCourse._id});
      });
    });
  });

  app.contentmanager.addContentHook('update', 'course', {when:'pre'}, function (data, next) {
    if (data[1].hasOwnProperty('themeSettings') || data[1].hasOwnProperty('customStyle')) {
      var tenantId = usermanager.getCurrentUser().tenant._id;

      app.emit('rebuildCourse', tenantId, data[0]._id);
    }

    next(null, data);
  });

  ['component'].forEach(function (contentType) {
    app.contentmanager.addContentHook('create', contentType, {when: 'pre'}, function(contentType, data, next) {
      var user = usermanager.getCurrentUser();

      database.getDatabase(function (err, db) {
        if (err) {
            logger.log('error', err);
            return next(err)
        }

        var delta = data[0];

        db.retrieve('component', {_courseId: delta._courseId, _component: delta._component}, function(err, results) {
          if (results.length == 0) {
            // This is the first time this component has been added, so trigger a rebuild.
            if (user && user.tenant && user.tenant._id) {
              app.emit('rebuildCourse', user.tenant._id, delta._courseId);
            }
          }

          return next(null, data);
        });

      });
    }.bind(null, contentType));
  });

  ['component'].forEach(function (contentType) {
    app.contentmanager.addContentHook('destroy', contentType, {when: 'pre'}, function(contentType, data, next) {
      var user = usermanager.getCurrentUser();

      database.getDatabase(function (err, db) {
        if (err) {
            logger.log('error', err);
            return next(err)
        }

        db.retrieve('component', {_id: data[0]._id}, function(err, results) {
          if (err) {
            logger.log('error', err);
            return next(err);
          }

          if (results && results.length == 1) {
            var delta = results[0];

            db.retrieve('component', {_courseId: delta._courseId, _component: delta._component}, function(err, results) {
              if (results.length <= 1) {
                // This component is no longer used in this course, so trigger a rebuild.
                if (user && user.tenant && user.tenant._id) {
                  app.emit('rebuildCourse', user.tenant._id, delta._courseId.toString());
                }
              }

              return next(null, data);
            });
          } else {
            // In theory the next line should never run.
            return next(null, data);
          }
        });
      });
    }.bind(null, contentType));
  });

  // Content Hook for updatedAt and updatedBy:
  ['contentobject', 'article', 'block', 'component'].forEach(function (contentType) {
    app.contentmanager.addContentHook('update', contentType, {when:'post'}, function (contentType, data, next) {

      var userId = usermanager.getCurrentUser()._id;

      database.getDatabase(function (err, db) {
        if (err) {
            logger.log('error', err);
            return next(err)
        }

        // Defensive programming -- just in case
        if (data && data._courseId) {
          // If the _courseId is present, update the last updated date
          db.update('course', { _id: data._courseId }, { updatedAt: new Date(), updatedBy: userId }, function (err) {
            if (err) {
              logger.log('error', err);
              return next(err);
            }
            next(null, data);
          });
        } else {
          next(null, data);
        }

      });

    }.bind(null, contentType));

  });

}

/**
 * overrides base implementation of hasPermission
 *
 * @param {string} action
 * @param {object} contentItem
 * @param {callback} next (function (err, isAllowed))
 */
CourseContent.prototype.hasPermission = function (action, userId, tenantId, contentItem, next) {
  helpers.hasCoursePermission(action, userId, tenantId, contentItem, function(err, isAllowed) {
    if (err) {
      return next(err);
    }
    if (isAllowed) {
      return next(null, true);
    }
    var resource = permissions.buildResourceString(tenantId, `/api/content/course/${contentItem._courseId || '*'}`);
    permissions.hasPermission(userId, action, resource, next);
  });
};

/**
 * implements ContentObject#getModelName
 *
 * @return {string}
 */
CourseContent.prototype.getModelName = function () {
  return 'course';
};

/**
 * implements ContentObject#getChildType
 *
 * @return {string}
 */
CourseContent.prototype.getChildType = function () {
  return ['contentobject', 'config'];
};

/**
 * Overrides base.create
 * @param {object} data
 * @param {callback} next
 */
CourseContent.prototype.create = function (data, next) {
  var self = this;
  var user = usermanager.getCurrentUser();
  var tenantId = user.tenant && user.tenant._id;

  ContentPlugin.prototype.create.call(self, data, function (err, doc) {
    if (err) {
      logger.log('error', err);
      return next(err);
    }

    // grant the creating user full editor permissions
    permissions.createPolicy(user._id, function (err, policy) {
      if (err) {
        logger.log('error', 'there was an error granting editing permissions', err);
      }

      var resource = permissions.buildResourceString(tenantId, '/api/content/course/' + doc._id);
      permissions.addStatement(policy, ['create', 'read', 'update', 'delete'], resource, 'allow', function (err) {
        if (err) {
          logger.log('error', 'there was an error granting editing permissions', err);
        }
        return next(null, doc);
      });
    });
  });
};

/**
 * Overrides base.destroy
 * @param {object} search
 * @param {callback} next
 */
CourseContent.prototype.destroy = function (search, force, next) {
  var self = this;
  var user = app.usermanager.getCurrentUser();
  var tenantId = user.tenant && user.tenant._id;
  // shuffle params
  if ('function' === typeof force) {
    next = force;
    force = false;
  }
  self.hasPermission('delete', user._id, tenantId, search, function (err, isAllowed) {
    if (!isAllowed && !force) {
      return next(new ContentPermissionError());
    }
    // to cascade deletes, we need the _id, which may not be in the search param
    self.retrieve(search, function (error, docs) {
      if (error) {
        return next(error);
      }
      if (!docs || !docs.length) {
        return next(null);
      }
      var resource = permissions.buildResourceString(tenantId, '/api/content/course/*');
      permissions.hasPermission(user._id, 'delete', resource, function(error, canDeleteAll) {
        // Final check before deletion
        if(!canDeleteAll) {
          return next(new ContentPermissionError());
        }
        // Courses use cascading delete
        async.eachSeries(docs, function(doc, cb) {
          self.destroyChildren(doc._id, '_courseId', cb);
        }, function (err) {
          ContentPlugin.prototype.destroy.call(self, search, true, next);
        });
      });
    });
  });
};

/**
 * Duplicate a course
 * @param {array} data
 * @param {callback} cb
 */
function duplicate (data, cb) {
  var self = this;
  var user = app.usermanager.getCurrentUser();

  if (!data) {
    return cb(null);
  }

  // Duplicate item
  CourseContent.prototype.retrieve({_id: data._id}, function (error, docs) {
    if (error) {
      return cb(error);
    }
    if (docs && docs.length) {
      var doc = docs[0].toObject();
      var oldCourseId = doc._id;

      delete doc._id;

      // As this is a new course, no preview is yet available
      doc._hasPreview = false;

      // New course name
      doc.title = 'Copy of ' + doc.title;

      // Set the current user's ID as the creator
      doc.createdBy = user._id;

      CourseContent.prototype.create(doc, function (error, newCourse) {
        if (error) {
          logger.log('error', error);
          return cb(error);
        }

        var newCourseId = newCourse._id;
        var parentIdMap = [];

        database.getDatabase(function (error, db) {
          if (error) {
            logger.log('error', error);
            return cb(error);
          }

          async.eachSeries(['contentobject', 'article', 'block', 'component', 'config'], function (contenttype, nextContentType) {
            db.retrieve(contenttype, {_courseId: oldCourseId}, function (error, items) {
              if (error) {
                logger.log('error', error);
                return nextContentType(error);
              }

              if (!parentIdMap.length) {
                parentIdMap[oldCourseId] = newCourseId;
              }

              if (contenttype == 'contentobject') {
                items = sortContentObjects(items);
              }

              async.eachSeries(items, function (item, next) {
                var contentData = item.toObject();
                var oldId = contentData._id;
                var oldParentId = contentData._parentId;

                delete contentData._id;
                contentData._courseId = newCourseId;
                contentData._parentId = parentIdMap[oldParentId];

                if(oldParentId && !contentData._parentId) {
                  logger.log('warn', `Cannot copy ${contenttype} '${oldId}', cannot find parent object with ID '${oldParentId}'`);
                  return next();
                }
                return db.create(contenttype, contentData, function (error, newContent) {
                  if (error) {
                    logger.log('error', error);
                    return next(error);
                  }
                  parentIdMap[oldId] = newContent._id;
                  next();
                });

              }, function (error) {
                if (error) {
                  logger.log('error', error);
                  return cb(error);
                }

                nextContentType(null);
              });
            });
          }, function (error) {
            if (error) {
              logger.log('error', error);
              cb(error, newCourse);
            } else {
              // Assuming there are no errors the assets must set the course assets
              db.retrieve('courseasset', {_courseId: oldCourseId}, function(error, items) {
                if (error) {
                  logger.log('error', error);
                  cb(error, newCourse);
                } else {
                  async.eachSeries(items, function(item, next) {
                    // For each course asset, before inserting the new document
                    // the _courseId, _contentTypeId and _contentTypeParentId must be changed
                    if (parentIdMap[item._contentTypeParentId]) {
                      var courseAsset = item.toObject();
                      delete courseAsset._id;

                      courseAsset._courseId = newCourseId;
                      courseAsset._contentTypeId = parentIdMap[item._contentTypeId];
                      courseAsset._contentTypeParentId = parentIdMap[item._contentTypeParentId];

                      return db.create('courseasset', courseAsset, function (error, newCourseAsset) {
                        if (error) {
                          logger.log('error', error);
                          return next(error);
                        } else {
                          next();
                        }
                      });
                    } else {
                      next();
                    }

                  }, function(error) {
                    if (error) {
                      logger.log('error', error);
                      cb(error);
                    } else {
                      cb(null, newCourse);
                    }
                  });
                }
              });
            }
          }); // end async.eachSeries()
        });
      });
    }
  });
};

/**
 * Sort contentObjects into correct creation order.
 * (Parent Menus must be created before child Menus/Pages)
 * @param {array} data
 * @param {callback} cb
 */
function sortContentObjects(data) {
  var flat = {},
      root = [],
      list = [],
      counter = 0;

  // Flatten the data
  for (var i = 0; i < data.length; i++) {
    var key = data[i].get('_id');

    flat[key] = {
      _id: data[i].get('_id'),
      _parentId: data[i].get('_parentId'),
      children: []
    };
  }

  // Populate any 'children' container arrays
  for (var i in flat) {
    var parentkey = flat[i]._parentId;

    if (flat[parentkey]) {
      flat[parentkey].children.push(flat[i]);
    }
  }

  // Find the root nodes (no parent found) and create the hierarchy tree from them
  for (var i in flat) {
    var parentkey = flat[i]._parentId;

    if (!flat[parentkey]) {
      root.push(flat[i]);
    }
  }

  for (var i in root) {
    appendToItems(list, root[i], counter);
  }

  for (var i = 0; i < data.length; i++) {
    data[i]._createOrder = list[data[i].get('_id')]._createOrder;
  }

  // Sort items according to creation order
  data.sort(function(a, b){
    return a._createOrder-b._createOrder;
  });

  return data;
};

/**
 * Recursive append item to list (and set creation order)
 * @param {array} list
 * @param {object} item
 * @param {int} counter
 */
function appendToItems (list, item, counter) {
  counter++;
  item._createOrder = counter;
  list[item._id] = item;

  if (item.children) {
    for (var i in item.children) {
      appendToItems(list, item.children[i], counter);
    }
  }
};

// setup course
initialize();

/**
 * Module exports
 *
 */

exports = module.exports = CourseContent;
