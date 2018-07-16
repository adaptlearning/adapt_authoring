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
    fs = require('fs-extra'),
    async = require('async'),
    archiver = require('archiver'),
    _ = require('underscore'),
    usermanager = require('../../../lib/usermanager'),
    assetmanager = require('../../../lib/assetmanager'),
    helpers = require('../../../lib/helpers'),
    exec = require('child_process').exec,
    semver = require('semver'),
    helpers = require('../../../lib/helpers'),
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
  var themeName = '';
  var menuName = Constants.Defaults.MenuName;
  var frameworkVersion;

  var resultObject = {};

  // shorthand directories
  var FRAMEWORK_ROOT_FOLDER = path.join(configuration.tempDir, configuration.getConfig('masterTenantID'), Constants.Folders.Framework);
  var SRC_FOLDER = path.join(FRAMEWORK_ROOT_FOLDER, Constants.Folders.Source);
  var COURSES_FOLDER = path.join(FRAMEWORK_ROOT_FOLDER, Constants.Folders.AllCourses);
  var COURSE_FOLDER = path.join(COURSES_FOLDER, tenantId, courseId);
  var BUILD_FOLDER = path.join(COURSE_FOLDER, Constants.Folders.Build);

  var customPluginName = user._id;

  async.series([
    // get an object with all the course data
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
    //
    function(callback) {
      var temporaryThemeFolder = path.join(SRC_FOLDER, Constants.Folders.Theme, customPluginName);
      self.applyTheme(tenantId, courseId, outputJson, temporaryThemeFolder, function(err, appliedThemeName) {
        if (err) {
          return callback(err);
        }
        // Replace the theme in outputJson with the applied theme name.
        themeName = appliedThemeName;
        outputJson['config'][0]._theme = themeName;
        callback(null);
      });
    },
    function(callback) {
      self.sanitizeCourseJSON(mode, outputJson, function(err, data) {
        if (err) {
          return callback(err);
        }
        // Update the JSON object
        outputJson = data;
        callback(null);
      });
    },
    function(callback) {
      self.buildFlagExists(path.join(BUILD_FOLDER, Constants.Filenames.Rebuild), function(err, exists) {
        if (err) {
          return callback(err);
        }
        isRebuildRequired = exists;
        callback(null);
      });
    },
    function(callback) {
      var temporaryThemeFolder = path.join(SRC_FOLDER, Constants.Folders.Theme, customPluginName);
      self.writeCustomStyle(tenantId, courseId, temporaryThemeFolder, function(err) {
        if (err) {
          return callback(err);
        }
        callback(null);
      });
    },
    function(callback) {
      var temporaryMenuFolder = path.join(SRC_FOLDER, Constants.Folders.Menu, customPluginName);
      self.applyMenu(tenantId, courseId, outputJson, temporaryMenuFolder, function(err, appliedMenuName) {
        if (err) {
          return callback(err);
        }
        menuName = appliedMenuName;
        callback(null);
      });
    },
    function(callback) {
      var assetsJsonFolder = path.join(BUILD_FOLDER, Constants.Folders.Course, outputJson['config']._defaultLanguage);
      var assetsFolder = path.join(assetsJsonFolder, Constants.Folders.Assets);

      self.writeCourseAssets(tenantId, courseId, assetsJsonFolder, assetsFolder, outputJson, function(err, modifiedJson) {
        if (err) {
          return callback(err);
        }
        // Store the JSON with the new paths to assets
        outputJson = modifiedJson;
        callback(null);
      });
    },
    function(callback) {
      self.writeCourseJSON(outputJson, path.join(BUILD_FOLDER, Constants.Folders.Course), function(err) {
        if (err) {
          return callback(err);
        }
        callback(null);
      });
    },
    function(callback) {
      installHelpers.getInstalledFrameworkVersion(function(error, version) {
        frameworkVersion = version;
        callback(error);
      });
    },
    function(callback) {
      fs.exists(path.join(BUILD_FOLDER, Constants.Filenames.Main), function(exists) {
        if (!isRebuildRequired && exists) {
          resultObject.success = true;
          return callback(null, 'Framework already built, nothing to do');
        }

        logger.log('info', '3.1. Ensuring framework build exists');

        var args = [];
        var outputFolder = COURSE_FOLDER.replace(FRAMEWORK_ROOT_FOLDER + path.sep,'');

        // Append the 'build' folder to later versions of the framework
        if (semver.gte(semver.clean(frameworkVersion), semver.clean('2.0.0'))) {
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
      });
    },
    function(callback) {
      self.clearBuildFlag(path.join(BUILD_FOLDER, Constants.Filenames.Rebuild), function(err) {
        callback(null);
      });
    },
    function(callback) {
      if (mode === Constants.Modes.Preview) { // No download required -- skip this step
        return callback();
      }
      // Now zip the build package
      var filename = path.join(COURSE_FOLDER, Constants.Filenames.Download);
      var zipName = helpers.slugify(outputJson['course'].title);
      var output = fs.createWriteStream(filename);
      var archive = archiver('zip');

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
      archive.glob('**/*', { cwd: path.join(BUILD_FOLDER) });
      archive.finalize();
    }
  ], function(err) {
    if (err) {
      logger.log('error', err);
      return next(err);
    }
    next(null, resultObject);
  });
};

/**
* Source (framework) import function
*/
AdaptOutput.prototype.importsource = require('./importsource');

/**
* FUNCTION: Export
* ------------------------------------------------------------------------------
*/

/**
* Global vars
* For access by the other funcs
*/

// directories
var FRAMEWORK_ROOT_DIR = path.join(configuration.tempDir, configuration.getConfig('masterTenantID'), Constants.Folders.Framework);
var COURSE_ROOT_DIR;
var EXPORT_DIR;

var courseId;
// the top-level callback
var next;
// used with _.omit when saving metadata
var blacklistedProps = [
  '__v',
  '_isDeleted',
  'createdAt',
  'createdBy',
  'updatedAt',
  'updatedBy',
  '_hasPreview'
];

AdaptOutput.prototype.export = function(pCourseId, request, response, pNext) {
  self = this;
  // store the params
  var currentUser = usermanager.getCurrentUser();
  COURSE_ROOT_DIR = path.join(FRAMEWORK_ROOT_DIR, Constants.Folders.AllCourses, currentUser.tenant._id, pCourseId);
  EXPORT_DIR = path.join(configuration.tempDir, configuration.getConfig('masterTenantID'), Constants.Folders.Exports, currentUser._id);
  courseId = pCourseId;
  next = pNext;
  // create the EXPORT_DIR if it isn't there
  fs.ensureDir(EXPORT_DIR, function(error) {
    if(error) {
      return next(error);
    }
    async.auto({
      generateLatestBuild: generateLatestBuild,
      copyFrameworkFiles: ['generateLatestBuild', copyFrameworkFiles],
      copyCourseFiles: ['generateLatestBuild', copyCourseFiles]
    }, zipExport);
  });
};

function generateLatestBuild(courseBuilt) {
  self.publish(courseId, Constants.Modes.export, null, null, courseBuilt);
};

/**
* Copy functions
*/

// copies relevant files in adapt_framework
function copyFrameworkFiles(results, filesCopied) {
  self.generateIncludesForCourse(courseId, function(error, includes) {
    if(error) {
      return filesCopied(error);
    }
    // create list of includes
    for(var i = 0, count = includes.length; i < count; i++)
      includes[i] = '\/' + includes[i] + '(\/|$)';

    var includesRE = new RegExp(includes.join('|'));
    var excludesRE = new RegExp(/\.git\b|\.DS_Store|\/node_modules|\/courses\b|\/course\b|\/exports\b/);
    var pluginsRE = new RegExp('\/components\/|\/extensions\/|\/menu\/|\/theme\/');

    fs.copy(FRAMEWORK_ROOT_DIR, EXPORT_DIR, {
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
    }, filesCopied);
  });
};

// uses the metadata list to include only relevant plugin files
function copyCustomPlugins(results, filesCopied) {
  var src = path.join(FRAMEWORK_ROOT_DIR, Constants.Folders.Source);
  var dest = path.join(EXPORT_DIR, Constants.Folders.Plugins);
  _.each(metadata.pluginIncludes, function iterator(plugin) {
    var pluginDir = path.join(src, plugin.folder, plugin.name);
    fs.copy(pluginDir, path.join(dest, plugin.name), function(err) {
      if (err) logger.log('error', err);
    });
  });
  filesCopied();
};

// copies everything in the course folder
function copyCourseFiles(results, filesCopied) {
  var source = path.join(COURSE_ROOT_DIR, Constants.Folders.Build, Constants.Folders.Course);
  var dest = path.join(EXPORT_DIR, Constants.Folders.Source, Constants.Folders.Course);
  fs.ensureDir(dest, function(error) {
    if (error) {
      return filesCopied(error);
    }
    fs.copy(source, dest, filesCopied);
  });
};

// copies used assets directly from the data folder
function copyAssets(results, assetsCopied) {
  var dest = path.join(EXPORT_DIR, Constants.Folders.Assets);
  fs.ensureDir(dest, function(error) {
    if (error) {
      return assetsCopied(error);
    }
    async.each(Object.keys(metadata.assets), function iterator(assetKey, doneIterator) {
      var oldId = metadata.assets[assetKey].oldId;
      origin.assetmanager.retrieveAsset({ _id:oldId }, function(error, results) {
        if(error) {
          return doneIterator(error);
        }
        filestorage.getStorage(results[0].repository, function gotStorage(error, storage) {
          var srcPath = storage.resolvePath(results[0].path);
          var destPath = path.join(dest, assetKey);
          fs.copy(srcPath, destPath, doneIterator);
        });
      });
    }, assetsCopied);
  });
};

/**
* post-processing
*/

function zipExport(error) {
  if(error) {
    return next(error);
  }
  var archive = archiver('zip');
  var output = fs.createWriteStream(EXPORT_DIR +  '.zip');

  output.on('close', cleanUpExport);

  archive.on('warning', function(err) {
    logger.log('warn', err);
  });
  archive.on('error', function(error){
    logger.log('error', error);
    cleanUpExport();
  });
  archive.pipe(output);
  archive.glob('**/*', { cwd: path.join(EXPORT_DIR) });
  archive.finalize();

};

// remove the EXPORT_DIR, if there is one
function cleanUpExport(exportError) {
  fs.remove(EXPORT_DIR, function(removeError) {
    next(exportError || removeError);
  });
};


/**
 * Module exports
 *
 */

exports = module.exports = AdaptOutput;
