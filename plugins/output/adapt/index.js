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
    fse = require('fs-extra'),
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
    installHelpers = require('../../../lib/installHelpers'),
    logger = require('../../../lib/logger');

function AdaptOutput() {
}

util.inherits(AdaptOutput, OutputPlugin);

AdaptOutput.prototype.publish = function(courseId, mode, request, response, next) {
  var app = origin();
  var self = this;
  var user = usermanager.getCurrentUser();
  var tenantId = user.tenant._id;
  var outputJson = {};
  var isRebuildRequired = false;
  var themeName;
  var menuName = Constants.Defaults.MenuName;
  var frameworkVersion;
  // shorthand directories
  var FRAMEWORK_ROOT_FOLDER = path.join(configuration.tempDir, configuration.getConfig('masterTenantID'), Constants.Folders.Framework);
  var SRC_FOLDER = path.join(FRAMEWORK_ROOT_FOLDER, Constants.Folders.Source);
  var COURSES_FOLDER = path.join(FRAMEWORK_ROOT_FOLDER, Constants.Folders.AllCourses);
  var COURSE_FOLDER = path.join(COURSES_FOLDER, tenantId, courseId);
  var BUILD_FOLDER = path.join(COURSE_FOLDER, Constants.Folders.Build);

  var customPluginName = user._id;

  async.series([
    function collateJSON(callback) {
      self.getCourseJSON(tenantId, courseId, function(err, data) {
        outputJson = data;
        callback(err);
      });
    },
    function doTheme(callback) {
      var temporaryThemeFolder = path.join(SRC_FOLDER, Constants.Folders.Theme, customPluginName);
      self.applyTheme(tenantId, courseId, outputJson, temporaryThemeFolder, function(err, appliedThemeName) {
        outputJson.config[0]._theme = themeName = appliedThemeName;
        callback(err);
      });
    },
    function sanitizeJSON(callback) {
      self.sanitizeCourseJSON(mode, outputJson, function(err, data) {
        outputJson = data;
        callback(err);
      });
    },
    function checkRebuildRequired(callback) {
      self.buildFlagExists(path.join(BUILD_FOLDER, Constants.Filenames.Rebuild), function(err, exists) {
        isRebuildRequired = exists;
        callback(err);
      });
    },
    function doCustomStyle(callback) {
      var temporaryThemeFolder = path.join(SRC_FOLDER, Constants.Folders.Theme, customPluginName);
      self.writeCustomStyle(tenantId, courseId, temporaryThemeFolder, function(err, appliedThemeName) {
        callback(err);
      });
    },
    function doMenu(callback) {
      var temporaryMenuFolder = path.join(SRC_FOLDER, Constants.Folders.Menu, customPluginName);
      self.applyMenu(tenantId, courseId, outputJson, temporaryMenuFolder, function(err, appliedMenuName) {
        menuName = appliedMenuName;
        callback(err);
      });
    },
    function writeAssets(callback) {
      var assetsFolder = path.join(BUILD_FOLDER, Constants.Folders.Course, outputJson['config']._defaultLanguage, Constants.Folders.Assets);
      self.writeCourseAssets(tenantId, courseId, assetsFolder, outputJson, function(err, modifiedJson) {
        outputJson = modifiedJson;
        callback(err);
      });
    },
    function writeJSON(callback) {
      self.writeCourseJSON(outputJson, path.join(BUILD_FOLDER, Constants.Folders.Course), callback);
    },
    function buildCourse(callback) {
      fs.exists(path.join(BUILD_FOLDER, Constants.Filenames.Main), function(exists) {
        if (exists && !isRebuildRequired) {
          return callback();
        }
        logger.log('info', '3.1. Ensuring framework build exists');

        installHelpers.getInstalledFrameworkVersion(function(error, frameworkVersion) {
          var outputFolder = COURSE_FOLDER.replace(FRAMEWORK_ROOT_FOLDER + path.sep, '');
          // Append the 'build' folder to later versions of the framework
          // FIXME probably about time we removed this...
          if (semver.gte(semver.clean(frameworkVersion), semver.clean('2.0.0'))) {
            outputFolder = path.join(outputFolder, Constants.Folders.Build);
          }
          logger.log('info', `3.2. Using theme: ${themeName}`);
          logger.log('info', `3.3. Using menu: ${menuName}`);

          var buildMode = outputJson.config._generateSourcemap === true ? 'dev' : 'prod';
          var cmd = `grunt server-build:${buildMode} --outputdir=${outputFolder} --theme=${themeName} --menu=${menuName}`;

          logger.log('info', cmd);

          exec(cmd, { cwd: FRAMEWORK_ROOT_FOLDER }, function(error, stdout, stderr) {
            if (error !== null || stderr.length !== 0) {
              if(error) {
                logger.log('error', `exec error: ${error}`);
                logger.log('error', `stdout error: ${stdout}`);
              } else {
                logger.log('error', `stderr: ${stderr}`);
              }
              return callback(error);
            }
            if (stdout.length > 0) {
              logger.log('info', `stdout: ${stdout}`);
              app.emit('previewCreated', tenantId, courseId, outputFolder);
            }
            self.clearBuildFlag(path.join(BUILD_FOLDER, Constants.Filenames.Rebuild), callback);
          });
        });
      });
    },
    function zipPackage(callback) {
      if (mode !== Constants.Modes.publish) { // no download required, skip
        return callback();
      }
      // Now zip the build package
      var filename = path.join(COURSE_FOLDER, Constants.Filenames.Download);
      var zipName = helpers.slugify(outputJson['course'].title);
      var output = fs.createWriteStream(filename);

      output.on('close', function() {
        // Indicate that the zip file is ready for download
        app.emit('zipCreated', tenantId, courseId, filename, zipName);
        next(null, {
          filename: filename,
          zipName: zipName
        });
      });
      archive.on('error', callback);
      archive.pipe(output);
      archive.bulk([ { expand: true, cwd: path.join(BUILD_FOLDER), src: ['**/*'] } ]).finalize();
    }
  ], function(err) {
    if (err) {
      logger.log('error', err);
    }
    next(err);
  });
};

AdaptOutput.prototype.export = function (courseId, request, response, next) {
  var self = this;
  var tenantId = usermanager.getCurrentUser().tenant._id;
  var timestamp = new Date().toISOString().replace('T', '-').replace(/:/g, '').substr(0,17);

  var FRAMEWORK_ROOT_FOLDER = path.join(configuration.tempDir, configuration.getConfig('masterTenantID'), Constants.Folders.Framework);
  var COURSE_ROOT_FOLDER = path.join(FRAMEWORK_ROOT_FOLDER, Constants.Folders.AllCourses, tenantId, courseId);

  // set in getCourseName
  var exportName;
  var exportDir;

  var mode = Constants.Modes.export;

  async.waterfall([
    function publishCourse(callback) {
      self.publish(courseId, mode, request, response, callback);
    },
    function getCourseName(results, callback) {
      database.getDatabase(function (error, db) {
        if (error) {
          return callback(err);
        }

        db.retrieve('course', { _id: courseId }, { jsonOnly: true }, function (error, results) {
          if (error) {
            return callback(error);
          }
          if(!results || results.length > 1) {
            return callback(new Error('Unexpected results returned for course ' + courseId + ' (' + results.length + ')', self));
          }

          exportName = self.slugify(results[0].title) + '-export-' + timestamp;
          exportDir = path.join(FRAMEWORK_ROOT_FOLDER, Constants.Folders.Exports, exportName);
          callback();
        });
      });
    },
    function copyFiles(callback) {
      self.generateIncludesForCourse(courseId, function(error, includes) {
        if(error) {
          return callback(error);
        }

        for(var i = 0, count = includes.length; i < count; i++)
          includes[i] = '\/' + includes[i] + '(\/|$)';

        // regular expressions
        var includesRE = new RegExp(includes.join('|'));
        var excludesRE = new RegExp(/\.git\b|\.DS_Store|\/node_modules(?!\.)|\/courses\b(?!\.)|\/course\b(?!\.)|\/exports\b/);
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
        }, function done(error) {
          if (error) {
            return callback(error);
          }
          var source = path.join(COURSE_ROOT_FOLDER, Constants.Folders.Build, Constants.Folders.Course);
          var dest = path.join(exportDir, Constants.Folders.Source, Constants.Folders.Course);
          fse.ensureDir(dest, function (error) {
            if(error) {
              return callback(error);
            }
            fse.copy(source, dest, callback);
          });
        });
      });
    },
    function zipFiles(callback) {
      var archive = archiver('zip');
      var output = fs.createWriteStream(exportDir +  '.zip');

      archive.on('error', callback);
      output.on('close', callback);
      archive.pipe(output);
      archive.bulk([{ expand: true, cwd: exportDir, src: ['**/*'] }]).finalize();
    },
    function cleanUp(callback) {
      fse.remove(exportDir, function (error) {
        callback(error, { zipName: exportName + '.zip' });
      });
    }
  ],
  next);
};

/**
 * Module exports
 *
 */

exports = module.exports = AdaptOutput;
