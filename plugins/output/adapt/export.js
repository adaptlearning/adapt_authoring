var archiver = require('archiver');
var async = require('async');
var Constants = require('../../../lib/outputmanager').Constants;
var configuration = require('../../../lib/configuration');
var database = require('../../../lib/database');
var fse = require('fs-extra');
var origin = require('../../../')();
var path = require('path');
var usermanager = require('../../../lib/usermanager');

/**
* Course import function
* TODO need implementation notes
* TODO customise for standard export:
* - No core, core plugins or associated files
* - No json
* - Yes metadata
* - Yes assets
* - Yes custom plugins
*/

exports = module.exports = function Export(courseId, request, response, next) {
  var self = this;
  var tenantId = usermanager.getCurrentUser().tenant._id;
  var userId = usermanager.getCurrentUser()._id;
  var FRAMEWORK_ROOT_FOLDER = path.join(configuration.tempDir, configuration.getConfig('masterTenantID'), Constants.Folders.Framework);
  var COURSE_ROOT_FOLDER = path.join(FRAMEWORK_ROOT_FOLDER, Constants.Folders.AllCourses, tenantId, courseId);
  var exportDir = path.join(FRAMEWORK_ROOT_FOLDER, Constants.Folders.Exports, userId);

  // ensure the exportDir exists
  fse.ensureDir(exportDir, function(error) {
    if(error) {
      return next(error);
    }
    async.parallel([
      function generateMetaData(generatedMetadata) {
        async.parallel([
          function(callback) {
            getCourseMetdata(courseId, callback);
          },
          function(callback) {
            getAssetMetadata(courseId, callback);
          },
          function(callback) {
            getPluginMetadata(courseId, callback);
          },
        ], function(error, results) {
          if(error) {
            return generatedMetadata(error);
          }
          // TODO add filename to constants?
          var metadata = _.reduce(results, function(memo,result){ return _.extend(memo,result); });
          fse.writeJson(path.join(exportDir, 'metadata.json'), metadata, generatedMetadata);
        });
      },
      // builds course & copies framework files
      function getLatestBuild(preparedFiles) {
        self.publish(courseId, true, request, response, function coursePublished(error) {
          if(error) {
            return preparedFiles(error);
          }
          self.generateIncludesForCourse(courseId, function(error, includes) {
            if(error) {
              return preparedFiles(error);
            }

            for(var i = 0, count = includes.length; i < count; i++)
            includes[i] = '\/' + includes[i] + '(\/|$)';

            // regular expressions
            var includesRE = new RegExp(includes.join('|'));
            var excludesRE = new RegExp(/\.git\b|\.DS_Store|\/node_modules|\/courses\b|\/course\b|\/exports\b/);
            var pluginsRE = new RegExp('\/components\/|\/extensions\/|\/menu\/|\/theme\/');

            fse.copy(FRAMEWORK_ROOT_FOLDER, exportDir, {
              filter: function(filePath) {
                var posixFilePath = filePath.replace(/\\/g, '/');
                var isIncluded = posixFilePath.search(includesRE) > -1;
                var isExcluded = posixFilePath.search(excludesRE) > -1;
                var isPlugin = posixFilePath.search(pluginsRE) > -1;

                // exclude any matches to excludesRE
                if(isExcluded) return false;
                // exclude any plugins not in includes
                else if(isPlugin) return isIncluded;
                // include everything else
                else return true;
              }
            }, function doneCopy(error) {
              if (error) {
                return preparedFiles(error);
              }
              var source = path.join(COURSE_ROOT_FOLDER, Constants.Folders.Build, Constants.Folders.Course);
              var dest = path.join(exportDir, Constants.Folders.Source, Constants.Folders.Course);
              fse.ensureDir(dest, function(error) {
                if(error) {
                  return preparedFiles(error);
                }
                fse.copy(source, dest, preparedFiles);
              });
            });
          });
        });
      }
    ], function doneParallel(error) {
      // write metadata, zip files
      if(error) return next(error);

      var archive = archiver('zip');
      var output = fse.createWriteStream(exportDir +  '.zip');
      archive.on('error', cleanUpExport);
      output.on('close', cleanUpExport);
      archive.pipe(output);
      archive.bulk([{ expand: true, cwd: exportDir, src: ['**/*'] }]).finalize();
    });
  });

  // remove the exportDir, if there is one
  function cleanUpExport(exportError) {
    fse.remove(exportDir, function(removeError) {
      // prefer exportError
      next(exportError || removeError)
    });
  }
};

function getCourseMetdata(courseId, gotCourseMetadata) {
  database.getDatabase(function(error, db) {
    if (error) {
      return callback(error);
    }
    var metadata = {
      course: {}
    };

    async.each(Object.keys(Constants.CourseCollections), function iterator(collectionType, doneIterator) {
      var criteria = collectionType === 'course' ? { _id: courseId } : { _courseId: courseId };
      db.retrieve(collectionType, criteria, {operators: { sort: { _sortOrder: 1}}}, function dbRetrieved(error, results) {
        if (error) {
          callback(doneIterator);
        }
        // TODO need save as little metadata as possible
        // HACK do this if check better
        // only store the _doc values
        var isConfig = collectionType === 'course' || collectionType === 'config';
        var toSave = _.pluck(results,'_doc');

        // remove blacklisted properties (TODO and JSON data?)
        var blacklist = [
          '__v',
          '_isDeleted',
          'createdAt',
          'createdBy',
          'updatedAt',
          'updatedBy'
        ];
        _.each(toSave, function(item, index) { toSave[index] = _.omit(item, blacklist); });
        metadata.course[collectionType] = toSave;

        doneIterator();
      });
    }, function doneEach(error) {
      gotCourseMetadata(error, metadata);
    });
  }, usermanager.getCurrentUser().tenant._id);
};

function getAssetMetadata(courseId, gotAssetMetadata) {
  var metadata = {
    assets: {}
  };
  origin.contentmanager.getContentPlugin('courseasset', function(error, plugin) {
    plugin.retrieve({ _courseId:courseId }, function(error, results) {
      if(error) {
        return gotAssetMetadata(error);
      }
      async.each(results, function iterator(courseasset, doneIterator) {
        origin.assetmanager.retrieveAsset({ _id:courseasset._assetId }, function(error, matchedAssets) {
          if(error) {
            return doneIterator(error);
          }
          // TODO safe to assume only one's returned?
          if(!matchedAssets) {
            return doneIterator(new Error('No asset found with id: ' + courseasset._assetId));
          }
          var asset = matchedAssets[0];

          // would _.pick, but need to map some keys
          if(!metadata.assets[asset.filename]) {
            metadata.assets[asset.filename] = {
              "title": asset.title,
              "description": asset.description,
              "type": asset.mimeType,
              "size": asset.size
            };
          }
          // else console.log('Asset already stored:', asset.filename);

          doneIterator();
        })
      }, function doneEach(error) {
        gotAssetMetadata(error, metadata);
      });
    });
  });
};

function getPluginMetadata(courseId, gotPluginMetadata) {
  /*
  * TODO there's got to be a way to get this info dynamically
  * We need:
  * - Content plugin name to see if it's already installed (so need plugin type)
  * - Plugin folder name to find plugin code (so need the plugin folder name -- maybe do this with a glob/search?)
  * (See Import.importPlugins for context)
  * For now, add map to metadata
  */
  gotPluginMetadata(null, {
    pluginTypes: [
      { type: 'component', folder: 'components' },
      { type: 'extension', folder: 'extensions' },
      { type: 'menu',      folder: 'menu'       },
      { type: 'theme',     folder: 'theme'      }
    ]
  });
};
