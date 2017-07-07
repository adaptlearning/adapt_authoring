// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
var _ = require('underscore');
var async = require('async');
var fs = require("fs-extra");
var path = require("path");
var IncomingForm = require('formidable').IncomingForm;

var origin = require('../../../')();
var database = require("../../../lib/database");
var logger = require("../../../lib/logger");
var usermanager = require('../../../lib/usermanager');
var glob = require('glob');
var Constants = require('../../../lib/outputmanager').Constants;
var helpers = require('./helpers');

// TODO integrate with sockets API to show progress

function Import(req, done) {

  var tenantId = usermanager.getCurrentUser().tenant._id;
  var COURSE_ROOT_FOLDER = path.join(configuration.tempDir, configuration.getConfig('masterTenantID'), Constants.Folders.Framework, Constants.Folders.AllCourses, tenantId);
  var unzipFolder = tenantId + '_unzipped';
  var courseRoot = path.join(COURSE_ROOT_FOLDER, unzipFolder);
  var cleanupDirs = [];
  var metadata = {};
  var form = new IncomingForm();


  /**
  * FUNCTION: Import
  * ------------------------------------------------------------------------------
  */

  form.parse(req, function (error, fields, files) {

    if (error) return next(error);
    /**
    * Main process
    * All functions delgated below for readability
    */
    async.series([
      function extractFiles(cb) {
        if(!files.file || !files.file.path) {
          return cb(new helpers.ImportError('File upload failed.'));
        }
        var zipPath = files.file.path;
        cleanupDirs.push(zipPath,courseRoot);
        helpers.unzip(zipPath, courseRoot, cb);
      },
      function doPreparation(cb) {
        prepareImport(cb);
      },
      function asyncPlugins(cb) {
        importPlugins(cb);
      },
      function asyncTagsJson(cb) {
        importTagsJson(cb);
      },
      function asyncCourseJson(cb) {
        importCourseJson(cb);
      },
      function asyncAssets(cb) {
        importAssets(cb);
      },
      function asyncCourseAssets(cb) {
        importCourseassets(cb);
      },
      function doneImport(cb) {
        helpers.cleanUpImport(cleanupDirs, cb);
      }
    ], function(error, results) {
      if (error) {
        // TODO might need to run cleanUpImport as well.
        removeImport(function ImportRemoved(removalError) {
          return done(removalError || error);
        });
      }
      done(error);
    });
  });


  /*
  * 1. Unzips uploaded zip
  * 2. Validates the import's metadata
  * 3. Checks compatibility of import with this AT instance
  */
  function prepareImport(callback) {
    async.auto({
      loadMetadata: function(cb) {
        fs.readJson(path.join(courseRoot, Constants.Filenames.Metadata), function onJsonRead(error, metadataJson) {
          if(error) {
            // TODO any other possible errors?
            switch(error.name) {
              case 'SyntaxError':
                return cb(new helpers.ImportError('Import contains invalid metadata, please check the archive.', 400));
              default:
                return cb(new helpers.ImportError('Unable to load metadata. Please check archive is a valid import package.', 400));
            }
          }
          metadata = metadataJson;
          // make sure everything's in the right order for processing
          sortMetadata(cb);
        });
      },
      checkVersionCompatibility: ['loadMetadata', function(cb) {
        helpers.checkFrameworkVersion(metadata, cb);
      }]
    }, function doneAuto(error, data) {
      callback(error);
    });
  };

  /*
  * Sorts in-place the metadata ABCs to make sure processing can happen
  * (only needed for content objects currently)
  */
  function sortMetadata(callback) {
    async.forEachOf(metadata.course, function iterator(item, type, cb) {
      switch(type) {
        case 'contentobject':
          var groups = _.groupBy(item, '_type');
          var sortedSections = helpers.sortContentObjects(groups.menu, metadata.course.course[0]._id, []);
          metadata.course[type] = sortedSections.concat(groups.page);
          break;
        default:
          break;
      }
      cb();
    }, function(error) {
      callback(error);
    });
  };


  /**
  * Adds tags to the DB
  * Checks for a similar tag first (tag title). if similar found, map that
  * to the imported course.
  */
  function importTagsJson(cb) {
    var userId = usermanager.getCurrentUser()._id;
    // init the id map
    metadata.idMap = {};

    origin.contentmanager.getContentPlugin('tag', function gotTagsPlugin(error, plugin) {
      if(error) {
        logger.log('error', error)
        return cb(error);
      }
      async.eachSeries(metadata.tags, function itemIterator(tagJson, doneItemIterator) {
        if (tagJson !== undefined) {
          var memo = _.omit(tagJson, 'oldId');
          plugin.create(memo, function tagIterator(error, newDoc) {
            if(error) {
              return doneItemIterator(error);
            }
            var newObj = newDoc.toObject();
            metadata.idMap[tagJson.oldId] = newObj._id;
            doneItemIterator();
          });
        } else {
          doneItemIterator();
        }
      }, cb);
    });
  };

  function importCourseJson(cb) {
    var userId = usermanager.getCurrentUser()._id;
    var oldCourseId = metadata.course.course[0]._id;
    var newCourseId;
    // HACK this is bad
    var order = [
      'course',
      'config',
      'contentobject',
      'article',
      'block',
      'component',
    ];

    async.eachSeries(order, function typeIterator(courseKey, doneTypeIterator) {
      origin.contentmanager.getContentPlugin(courseKey, function gotContentPlugin(error, plugin) {
        if(error) {
          return doneTypeIterator(error);
        }
        async.eachSeries(metadata.course[courseKey], function itemIterator(json, doneItemIterator) {
          // memoise to keep the metadata as it is, omitting id
          var memo = _.omit(json, '_id');
          if(newCourseId) {
            // we're doing everything in hierarchy order, so should have a _parentId
            memo._parentId = metadata.idMap[json._parentId];
            memo._courseId = newCourseId;
          }
          // replace tags with mapped id's, if no match remove tag.
          _.each(memo.tags, function iterator(tag, index) {
            if (metadata.idMap[tag]) {
              memo.tags[index] = metadata.idMap[tag];
            } else {
              memo.tags.splice(index, 1);
            }
          });
          memo.createdBy = userId;

          plugin.create(memo, function onCreated(error, newDoc) {
            if(error) {
              return doneItemIterator(error);
            }
            var newObj = newDoc.toObject();
            // must be a course
            if(!newCourseId) {
              newCourseId = newObj._id;
            }
            metadata.idMap[json._id] = newObj._id;
            doneItemIterator();
          });
        }, doneTypeIterator);
      });
    }, cb);
  };

  function importAssets(cb) {
    var assetsGlob = path.join(courseRoot, Constants.Folders.Assets, '*');
    glob(assetsGlob, function (error, assets) {
      if(error) {
        return cb(error);
      }
      var repository = configuration.getConfig('filestorage') || 'localfs';
      /**
      * TODO look into possibility of doing this parallel
      * Just using .each as is causes error in permissions.js.addStatement: db.update 'VersionError: no document found').
      * See: http://aaronheckmann.blogspot.co.uk/2012/06/mongoose-v3-part-1-versioning.html for background info
      */
      async.eachSeries(assets, function iterator(assetPath, doneAsset) {
        if (error) {
          return doneAsset(error);
        }
        var assetName = path.basename(assetPath);
        // TODO look into creating a vinyl file here
        var fileMeta = _.extend(metadata.assets[assetName], {
          filename: assetName,
          path: assetPath,
          repository: repository,
          createdBy: origin.usermanager.getCurrentUser()._id
        });
        if(!fileMeta) {
          return doneAsset(new helpers.ImportError('No metadata found for asset: ' + assetName));
        }
        helpers.importAsset(fileMeta, metadata, doneAsset);
      }, cb);
    });
  };


  function importCourseassets(cb) {
    origin.contentmanager.getContentPlugin('courseasset', function(error, plugin) {
      async.each(metadata.courseassets, function(courseasset, createdCourseasset) {
        courseasset._courseId = metadata.idMap[courseasset._courseId];
        courseasset._assetId = metadata.idMap[courseasset._assetId];
        if (metadata.idMap[courseasset._contentTypeParentId]) {
          courseasset._contentTypeParentId = metadata.idMap[courseasset._contentTypeParentId];
        }
        courseasset.createdBy = app.usermanager.getCurrentUser();
        if (courseasset._assetId !== undefined) {
          plugin.create(courseasset, createdCourseasset);
        } else {
          createdCourseasset();
        }
      }, cb);
    });
  };

  /**
  * Installs any plugins which aren't already in the system.
  * NOTE no action taken for plugins which are newer than installed version (just logged)
  */
  function importPlugins(cb) {
    var srcDir = path.join(courseRoot, Constants.Folders.Plugins);
    async.each(metadata.pluginIncludes, function(pluginData, donePluginIterator) {
      helpers.importPlugin(path.join(srcDir, pluginData.name), pluginData.type, donePluginIterator);
    }, cb);
  };

  /*
  * Completely removes an imported course (i.e. course data, assets, plugins)
  */
  function removeImport(doneRemove) {
    // if there's no idMap, there's no course to delete
    var idsMapped = metadata.idMap !== undefined;
    var newCourseId = metadata.idMap && metadata.idMap[metadata.course.course[0]._id];
    async.parallel([
      function deleteCourse(cb) {
        if(!idsMapped) return cb();
        origin.contentmanager.getContentPlugin('course', function gotCoursePlugin(error, coursePlugin) {
          if(error) return cb(error);
          coursePlugin.destroy({ _id: newCourseId }, cb);
        });
      },
      // TODO this should be done by course.destroy
      function deleteCourseassets(cb) {
        if(!idsMapped) return cb();
        database.getDatabase(function (error, db) {
          if(error) return cb(error);
          db.destroy('courseasset', { _courseId: newCourseId }, cb);
        });
      },
      function deleteAssets(cb) {
        if(!idsMapped) return cb();
        var importedAssets = _.where(metadata.assets, { wasImported: true });
        async.each(importedAssets, function deleteAsset(asset, assetDeleted) {
          origin.assetmanager.destroyAsset(metadata.idMap[asset.oldId], assetDeleted);
        }, cb);
      }
      // TODO - Need to check if plugin has been installed with this import before removing
      /* function deletePlugins(cb) {
        async.each(metadata.pluginIncludes, function(pluginData, donePluginIterator) {
          origin.bowermanager.destroyPlugin(pluginData.type, pluginData.name, donePluginIterator);
        }, cb);
      } */
    ], doneRemove);
  };

}

/**
 * Module exports
 *
 */

exports = module.exports = Import;
