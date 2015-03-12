// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
/**
 * Shared courses in the Learning Pool Styleee
 */

var contentmanager = require('../../../lib/contentmanager'),
    tenantmanager = require('../../../lib/tenantmanager'),
    ContentPlugin = contentmanager.ContentPlugin,
    ContentPermissionError = contentmanager.errors.ContentPermissionError,
    CourseContent = require('../course'),
    configuration = require('../../../lib/configuration'),
    permissions = require('../../../lib/permissions'),
    usermanager = require('../../../lib/usermanager'),
    util = require('util'),
    path = require('path'),
    async = require('async'),
    origin = require('../../../'),
    rest = require('../../../lib/rest'),
    _ = require('underscore'),
    ncp = require('ncp').ncp,
    mkdirp = require('mkdirp'),
    logger = require('../../../lib/logger'),
    database = require('../../../lib/database'),
    usermanager = require('../../../lib/usermanager');


function SharedContent () {
}

util.inherits(SharedContent, ContentPlugin);

/**
 * implements ContentObject#getModelName
 *
 * @return {string}
 */
SharedContent.prototype.getModelName = function () {
  return false;
};

/**
 * implements ContentObject#getChildType
 *
 * @return {string}
 */
SharedContent.prototype.getChildType = function () {
  return false;
};

/**
 * override behaviour
 *
 * @param {object} db
 * @param {callback} next
 */
SharedContent.prototype.onDatabaseCreated = function (db, next) {
  return next();
};

/**
 * essential setup
 *
 * @api private
 */
function initialize () {
  var self = this;
  var app = origin();
  app.once('serverStarted', function (server) {

    //endpoint for subscribed tags -  returns the tags of master tenant for subscribed course
    app.rest.get('/subscribed/tag', function (req, res, next) {
      database.getDatabase(function (err, db) {
        if (err) {
          return next(err);
        }
        db.retrieve('tag', { _isDeleted:false }, { fields: 'title' }, function (err, results) {
          if (err) {
            return next(err);
          }
          var tags = [];
          if (results.length){
            return async.eachSeries(
              results,
              function (item, cb) {
                tags.push({title: item.title, _id: item._id});
                return cb();
              },
              function(){
                res.statusCode = 200;
                return res.json(tags);
              }
            );
          }
        });
      }, configuration.getConfig('dbName'));
    });

    // AB-56 - endpoint for subscribed courses
    rest.get('/subscribed/course', function (req, res, next) {
      var options = req.query.operators || {};
      var search = req.query.search || {};
      var orList = [];
      var andList = [];

      // Ensure the tags are populated
      var pop = { tags: '_id title' };
      if (!options.populate) {
        options.populate = pop;
      } else {
        options.populate = _.extend(pop, options.populate);
      }

      // first, find out the subscriptions for the current tenant
      var currentUser = app.usermanager.getCurrentUser();
      app.productmanager.retrieveSubscriptions({ tenant: currentUser.tenant._id, _isDeleted: false }, function (err, subscriptions) {
        if (err) {
          return next(err);
        }

        // build a list of subscribed courses
        var subscribedCourses = [];
        var currentTime = new Date();
        if (subscriptions.length) {
          return async.eachSeries(
            subscriptions,

            function (sub, cb) {
              // ignore lapsed subscriptions
              if ((app.productmanager.ZERO_DATE != sub.timeEnd.getTime() && sub.timeEnd < currentTime) || sub.timeStart > currentTime) {
                return cb();
              }

              if (sub.product && sub.product.courses && !sub.product._isDeleted) {
                subscribedCourses = subscribedCourses.concat(sub.product.courses);
              }
              return cb();
            },
            function () {
              // retrieve courses from master tenant according to subscription
              database.getDatabase(function (err, db) {
                if (err) {
                  return next(err);
                }
                // convert strings to regex and build the search query
                Object.keys(search).forEach(function(key) {
                  var exp = {};
                  if ('string' === typeof search[key]) {
                    if ('_isShared' !== key ){
                      exp[key] = new RegExp(search[key], 'i');
                      orList.push(exp);  
                    }
                  } else {
                    exp[key] = search[key];
                    andList.push(exp);
                  }
                });

                var query = {};
                query._id = { $in: subscribedCourses };
                if (orList.length) {
                  query.$or = orList;
                }
                
                if (andList.length) {
                  query.$and = andList;
                }

                db.retrieve('course', query, options, function (err, results) {
                  if (err) {
                    return next(err);
                  }

                  res.statusCode = 200;
                  return res.json(results);
                });
              
              }, configuration.getConfig('dbName'));
            }
          );
        }

        res.statusCode = 200;
        return res.json([]);
      });
    });

    rest.get('/subscribed/duplicatecourse', function (req, res, next) {
      duplicateSubscribedCourse({_id: req.query.id, fromTenant: req.query.fromTenant}, function (error, newCourse) {
        if (error) {
          res.statusCode = 400;
          return res.json({success: false, message: error.message});
        }
        res.statusCode = 200;
        return res.json({success: true, newCourseId: newCourse._id});
      });
    });

  });
}

function duplicateSubscribedCourse (data, cb) {
  var self = this;
  var user = app.usermanager.getCurrentUser();
  var tenantId = user.tenant && user.tenant._id;

  if (!data) {
    return cb(new Error("duplicateSubscribedCourse called with invalid data argument"));
  }

  if (!tenantId) {
    return cb(new Error("Failed to determine user's tenant"));
  }

  tenantmanager.retrieveTenant({ _id: data.fromTenant}, function (error, tenantDoc) {
    if (error) {
      return cb(error);
    }

    // catch unknown tenants
    if (!tenantDoc) {
      return cb(new Error('Could not locate tenant: ' + data.fromTenant));
    }

    var tenant = tenantDoc.toObject();

    // Duplicate item -- get the course from the master tenant
    CourseContent.prototype.retrieve({_id: data._id}, { tenantId: tenant._id }, function (error, docs) {
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
        doc.createdBy = user._id;
        doc._tenantId = tenantId;
        doc._isShared = false;

        CourseContent.prototype.create(doc, function (error, newCourse) {
          var newCourseId = newCourse._id;
          var parentIdMap = [];

          database.getDatabase(function (error, masterDatabase) {
            if (error) {
              return cb(error);
            }

            database.getDatabase(function(error, tenantDatabase) {
              if (error) {
                return cb(error);
              }

              async.eachSeries(['contentobject', 'article', 'block', 'component', 'config'],
                function (contenttype, nextContentType) {
                  masterDatabase.retrieve(contenttype, {_courseId: oldCourseId}, function (error, items) {
                    if (error) {
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
                      contentData._tenantId = tenantId;
                      contentData._courseId = newCourseId;
                      contentData._parentId = parentIdMap[oldParentId];

                      return tenantDatabase.create(contenttype, contentData, function (error, newContent) {
                        if (error) {
                          return next(error);
                        }
                        parentIdMap[oldId] = newContent._id;
                        next();
                      });

                    }, function (error) {
                      if (error) {
                        return cb(error);
                      }

                      nextContentType(null);
                    });
                  });
                }, function (error) {
                  if (error) {
                    cb(error, newCourse);
                  } else {
                    // Assuming there are no errors the assets must set the course assets
                    masterDatabase.retrieve('courseasset', {_courseId: oldCourseId}, function(error, items) {
                      if (error) {
                        cb(error, newCourse);
                      } else {
                        async.eachSeries(items, function(item, next) {
                          var courseAsset = item.toObject();

                          // Get the individual asset record as the paths
                          // are needed to copy files
                          masterDatabase.retrieve('asset', {_id: courseAsset._assetId}, function(error, items) {
                            if (error) {
                              cb(error, newCourse);
                            }

                            if (items && items.length == 1) {
                              var asset = items[0].toObject();
                              // For each course asset, before inserting the new document
                              // the _courseId and _contentTypeParentId must be changed
                              delete courseAsset._id;

                              courseAsset._courseId = newCourseId;
                              if (parentIdMap[item._contentTypeParentId] !== undefined) {
                                courseAsset._contentTypeParentId = parentIdMap[item._contentTypeParentId];

                                // TODO - Interrogate the asset.repositary
                                // Call the corresponding MoveFile/CopyFileToTenant function
                                // Copy the assets from the master tenant
                                copyAsset(asset, tenant.name, user.tenant.name, function(error) {
                                  if (error) {
                                    logger.log('error', error);
                                    return next(error);
                                  }

                                  tenantDatabase.retrieve('asset', {filename: asset.filename}, function(error, results) {
                                    if (results && results.length) {
                                      // This asset already exists in the database
                                      var foundAsset = results[0].toObject();

                                      // we need to ensure the current user has permissions to view it, though
                                      return permissions.createPolicy(user._id, function (err, policy) {
                                        if (err) {
                                          logger.log('error', 'there was an error granting editing permissions', err);
                                        }

                                        var resource = permissions.buildResourceString(tenantId, '/api/asset/' + foundAsset._id);
                                        permissions.addStatement(policy, ['read'], resource, 'allow', function (err) {
                                          if (err) {
                                            logger.log('error', 'there was an error granting editing permissions', err);
                                          }
                                          // Just re-map the courseasset to this asset
                                          courseAsset._assetId = foundAsset._id;

                                          tenantDatabase.create('courseasset', courseAsset, function (error, newCourseAsset) {
                                            if (error) {
                                              logger.log('error', error.message, error);
                                              return next(error);
                                            }

                                            return next();
                                          });
                                        });
                                      });

                                    } else {
                                      // This is a new asset for this tenant
                                      delete asset._id;

                                      // Replace any fully qualified paths
                                      asset.thumbnailPath = asset.thumbnailPath.substring(asset.thumbnailPath.indexOf("assets"), asset.thumbnailPath.length);
                                      asset.path = asset.path.substring(asset.path.indexOf("assets"), asset.path.length);

                                      app.assetmanager.createAsset(asset, { user: user  }, function(error, newTenantAsset) {
                                        if (error) {
                                          return next(error);
                                        }

                                        courseAsset._assetId = newTenantAsset._id;

                                        return tenantDatabase.create('courseasset', courseAsset, function (error, newCourseAsset) {
                                          if (error) {
                                            return next(error);
                                          } else {
                                            next();
                                          }
                                        });
                                      });
                                    }

                                  }); // End call to tenantDatabase.retrieve()


                                }); // End call to copyAsset()
                              } else {
                                // Do not copy this asset -- it has no valid parent
                                next();
                              }
                            }  // End items length check
                          });  // End master select

                        }, function(error) {
                          if (error) {
                            cb(error);
                          } else {
                            cb(null, newCourse);
                          }
                        });
                      }
                    });
                  }
                });

            }); // Tenant database
          }, configuration.getConfig('dbName')); // Master database
        }); // CourseContent create
      } else {
        // course was not found
        return cb(new Error("failed to find course matching id: " + data._id));
      }

    });  // CourseContent retrieve
  });

};


function copyAsset(asset, fromTenantName, toTenantName, next) {
  // Verify the destination folder exists
  var assetFolder = path.join(configuration.serverRoot, configuration.getConfig('dataRoot'), toTenantName, asset.directory);

  mkdirp(assetFolder, function(error) {
    if (error) {
      logger.log('error', 'mkdirp error while copying asset, creating ' + assetFolder);
      return next(error);
    }

    // Copy the asset
    var sourceFile = path.join(configuration.serverRoot, configuration.getConfig('dataRoot'), fromTenantName, asset.path);
    var destinationFile = path.join(configuration.serverRoot, configuration.getConfig('dataRoot'), toTenantName, asset.path);


    ncp(sourceFile, destinationFile, {clobber:false}, function(error) {
      if (error) {
        logger.log('error', 'ncp error while copying ' + asset.filename);
        logger.log('error', 'error copying ' + sourceFile + ' to ' + destinationFile);
        return next(error);
      }

      //Copy the thumbnail (if required)
      if (asset.thumbnailPath && (asset.assetType == 'image' || asset.assetType == 'video')) {

        var sourceThumbnailFile = path.join(configuration.serverRoot, configuration.getConfig('dataRoot'), fromTenantName, asset.thumbnailPath);
        var destinationThumbnailFile = path.join(configuration.serverRoot, configuration.getConfig('dataRoot'), toTenantName, asset.thumbnailPath);

        ncp(sourceThumbnailFile, destinationThumbnailFile, function(error) {
          if (error) {
            logger.log('error', 'ncp error while copying ' + asset.thumbnailPath);
            logger.log('error', 'error copying (thumbnail) ' + sourceThumbnailFile + ' to ' + destinationThumbnailFile);

            // TODO If thumbnails fail it's not the end of the world -- for now
            //
            //return next(error);
          }

          return next(null);
        });
      } else {
        return next(null);
      }
    });
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

exports = module.exports = SharedContent;
