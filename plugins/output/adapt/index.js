// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
/**
 * Adapt Output plugin
 */

var origin = require('../../../'),
    OutputPlugin = require('../../../lib/outputmanager').OutputPlugin,
    Constants = require('../../../lib/outputmanager').Constants,
    configuration = require('../../../lib/configuration'),
    filestorage = require('../../../lib/filestorage'),
    database = require('../../../lib/database'),
    util = require('util'),
    path = require('path'),
    fs = require('fs'),
    async = require('async'),
    archiver = require('archiver'),
    _ = require('underscore'),
    ncp = require('ncp').ncp,
    rimraf = require('rimraf'),
    mkdirp = require('mkdirp'),
    usermanager = require('../../../lib/usermanager'),
    assetmanager = require('../../../lib/assetmanager'),
    exec = require('child_process').exec,
    semver = require('semver'),
    version = require('../../../version'),
    logger = require('../../../lib/logger');

function AdaptOutput() {
}

util.inherits(AdaptOutput, OutputPlugin);

AdaptOutput.prototype.publish = function(courseId, isPreview, request, response, next) {
  var app = origin();
  var self = this;
  var user = usermanager.getCurrentUser(),
    tenantId = user.tenant._id,
    outputJson = {},
    isRebuildRequired = false,
    themeName = Constants.Defaults.ThemeName,
    menuName = Constants.Defaults.MenuName;

  var resultObject = {};

  var FRAMEWORK_ROOT_FOLDER = path.join(configuration.tempDir, configuration.getConfig('masterTenantID'), Constants.Folders.Framework);

  async.series([
      function(callback) {
        self.getCourseJSON(tenantId, courseId, function(err, data) {
          if (err) {
            return callback(err);
          }

          // Store off the retrieved collections
          outputJson = data;

          callback(null);
        });
      },
      function(callback) {
        self.sanitizeCourseJSON(outputJson, function(err, data) {
          if (err) {
            return callback(err);
          }

          // Update the JSON object
          outputJson = data;

          callback(null);
        });
      },
      function(callback) {
        self.buildFlagExists(path.join(FRAMEWORK_ROOT_FOLDER, Constants.Folders.AllCourses, tenantId, courseId, Constants.Folders.Build, Constants.Filenames.Rebuild), function(err, exists) {
          if (err) {
            return callback(err);
          }

          isRebuildRequired = exists;

          callback(null);
        });
      },
      function(callback) {
        var temporaryThemeName = tenantId + '-' + courseId;
        var temporaryThemeFolder = path.join(FRAMEWORK_ROOT_FOLDER, Constants.Folders.Source, Constants.Folders.Theme, temporaryThemeName);

        self.applyTheme(tenantId, courseId, outputJson, temporaryThemeFolder, function(err, appliedThemeName) {
          if (err) {
            return callback(err);
          }

          themeName = appliedThemeName;

          callback(null);
        });
      },
      function(callback) {
        var temporaryThemeName = tenantId + '-' + courseId;
        var temporaryThemeFolder = path.join(FRAMEWORK_ROOT_FOLDER, Constants.Folders.Source, Constants.Folders.Theme, temporaryThemeName);

        self.writeCustomStyle(tenantId, courseId, temporaryThemeFolder, function(err) {
          if (err) {
            return callback(err);
          }

          callback(null);
        });
      },
      function(callback) {
        var temporaryMenuName = tenantId + '-' + courseId;
        var temporaryMenuFolder = path.join(FRAMEWORK_ROOT_FOLDER, Constants.Folders.Source, Constants.Folders.Menu, temporaryMenuName);

        self.applyMenu(tenantId, courseId, outputJson, temporaryMenuFolder, function(err, appliedMenuName) {
          if (err) {
            return callback(err);
          }

          menuName = appliedMenuName;

          callback(null);
        });
      },
      function(callback) {
        var assetsFolder = path.join(FRAMEWORK_ROOT_FOLDER, Constants.Folders.AllCourses, tenantId, courseId,
          Constants.Folders.Build, Constants.Folders.Course, outputJson['config']._defaultLanguage, Constants.Folders.Assets);

        self.writeCourseAssets(tenantId, courseId, assetsFolder, outputJson, function(err, modifiedJson) {
          if (err) {
            return callback(err);
          }

          // Store the JSON with the new paths to assets
          outputJson = modifiedJson;

          callback(null);
        });
      },
      function(callback) {
        self.writeCourseJSON(outputJson, path.join(FRAMEWORK_ROOT_FOLDER, Constants.Folders.AllCourses, tenantId, courseId, Constants.Folders.Build, Constants.Folders.Course), function(err) {
          if (err) {
            return callback(err);
          }

          callback(null);
        });
      },
      function(callback) {
        fs.exists(path.join(FRAMEWORK_ROOT_FOLDER, Constants.Folders.AllCourses, tenantId, courseId, Constants.Folders.Build, Constants.Filenames.Main), function(exists) {
          if (!exists || isRebuildRequired) {
            logger.log('info', '3.1. Ensuring framework build exists');

            var args = [];
            var outputFolder = path.join(Constants.Folders.AllCourses, tenantId, courseId);

            // Append the 'build' folder to later versions of the framework
            if (semver.gte(semver.clean(version.adapt_framework), semver.clean('2.0.0'))) {
              outputFolder = path.join(outputFolder, Constants.Folders.Build);
            }

            args.push('--outputdir=' + outputFolder);
            args.push('--theme=' + themeName);
            args.push('--menu=' + menuName);

            logger.log('info', '3.2. Using theme: ' + themeName);
            logger.log('info', '3.3. Using menu: ' + menuName);

            var generateSourcemap = outputJson.config._generateSourcemap;
            var buildMode = generateSourcemap === true ? 'dev' : 'prod';

            logger.log('info', 'grunt server-build:' + buildMode + ' ' + args.join(' '));

            child = exec('grunt server-build:' + buildMode + ' ' + args.join(' '), {cwd: path.join(FRAMEWORK_ROOT_FOLDER)},
                      function(error, stdout, stderr) {
                        if (error !== null) {
                          logger.log('error', 'exec error: ' + error);
                          logger.log('error', 'stdout error: ' + stdout);
                          resultObject.success = true;
                          return callback(error, 'Error building framework');
                        }

                        if (stdout.length != 0) {
                          logger.log('info', 'stdout: ' + stdout);
                          resultObject.success = true;
                          
                          // Indicate that the course has built successfully
                          app.emit('previewCreated', tenantId, courseId, outputFolder);
                          
                          return callback(null, 'Framework built OK');
                        }

                        if (stderr.length != 0) {
                          logger.log('error', 'stderr: ' + stderr);
                          resultObject.success = false;
                          return callback(stderr, 'Error (stderr) building framework!');
                        }

                        resultObject.success = true;
                        return callback(null, 'Framework built');
                      });
          } else {
            resultObject.success = true;
            callback(null, 'Framework already built, nothing to do')
          }
        });
      },
      function(callback) {
        if (!isPreview) {
          // Now zip the build package
          var filename = path.join(FRAMEWORK_ROOT_FOLDER, Constants.Folders.AllCourses, tenantId, courseId, Constants.Filenames.Download);
          var zipName = self.slugify(outputJson['course'].title);
          var output = fs.createWriteStream(filename),
            archive = archiver('zip');

          output.on('close', function() {
            resultObject.filename = filename;
            resultObject.zipName = zipName;
            
            // Indicate that the zip file is ready for download
            app.emit('zipCreated', tenantId, courseId, filename, zipName);
            
            callback();
          });
          archive.on('error', function(err) {
            logger.log('error', err);
            callback(err);
          });

          archive.pipe(output);

          archive.bulk([
            { expand: true, cwd: path.join(FRAMEWORK_ROOT_FOLDER, Constants.Folders.AllCourses, tenantId, courseId, Constants.Folders.Build), src: ['**/*'] },
          ]).finalize();

        } else {
          // No download required -- skip this step
          callback();
        }
      }
    ], function(err) {

      if (err) {
        logger.log('error', err);
        return next(err);
      }


      return next(null, resultObject);
    });

};
/**
 * Module exports
 *
 */

exports = module.exports = AdaptOutput;
