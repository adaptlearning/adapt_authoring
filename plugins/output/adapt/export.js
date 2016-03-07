var origin = require('../../../');
var Constants = require('../../../lib/outputmanager').Constants;
var configuration = require('../../../lib/configuration');
var path = require('path');
var fse = require('fs-extra');
var async = require('async');
var archiver = require('archiver');
var usermanager = require('../../../lib/usermanager');

/**
* Course import function
* TODO notes?
*/

exports = module.exports = function Export(courseId, request, response, next) {
  var app = origin();
  var self = this;
  var tenantId = usermanager.getCurrentUser().tenant._id;
  var userId = usermanager.getCurrentUser()._id;
  var FRAMEWORK_ROOT_FOLDER = path.join(configuration.tempDir, configuration.getConfig('masterTenantID'), Constants.Folders.Framework);
  var COURSE_ROOT_FOLDER = path.join(FRAMEWORK_ROOT_FOLDER, Constants.Folders.AllCourses, tenantId, courseId);
  var exportDir = path.join(FRAMEWORK_ROOT_FOLDER, Constants.Folders.Exports, userId);

  var metadata = {
    assets: {}
  };

  async.parallel([
    function generateMetaData(generatedMetadata) {
      app.contentmanager.getContentPlugin('courseasset', function(error, plugin) {
        plugin.retrieve({ _courseId:courseId }, function(error, results) {
          if(error) {
            return generatedMetadata(error);
          }
          async.each(results, function iterator(courseasset, doneIterator) {
            app.assetmanager.retrieveAsset({ _id:courseasset._assetId }, function(error, matchedAssets) {
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
          }, generatedMetadata);
        });
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

    // TODO add filename to constants
    fse.writeJson(path.join(exportDir, 'metadata.json'), metadata, function (error) {
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
