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
    version = require('../../../version'),
    logger = require('../../../lib/logger'),
    IncomingForm = require('formidable').IncomingForm;

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
    themeName = '',
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
        var temporaryThemeName = tenantId + '-' + courseId;
        var temporaryThemeFolder = path.join(FRAMEWORK_ROOT_FOLDER, Constants.Folders.Source, Constants.Folders.Theme, temporaryThemeName);

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

            // HACK Append the 'build' folder to later versions of the framework
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

      var config = require(path.join(FRAMEWORK_ROOT_FOLDER, Constants.Folders.AllCourses, tenantId, courseId, Constants.Folders.Build, Constants.Folders.Course, 'config.json'));
      console.log('end-build:', JSON.stringify(config.build,null,' '));

      return next(null, resultObject);
    });

};

AdaptOutput.prototype.export = function (courseId, request, response, next) {
  var self = this;
  var tenantId = usermanager.getCurrentUser().tenant._id;
  var userId = usermanager.getCurrentUser()._id;
  var timestamp = new Date().toISOString().replace('T', '-').replace(/:/g, '').substr(0,17);

  var FRAMEWORK_ROOT_FOLDER = path.join(configuration.tempDir, configuration.getConfig('masterTenantID'), Constants.Folders.Framework);
  var COURSE_ROOT_FOLDER = path.join(FRAMEWORK_ROOT_FOLDER, Constants.Folders.AllCourses, tenantId, courseId);

  // set in getCourseName
  var exportName;
  var exportDir;

  async.waterfall([
    function publishCourse(callback) {
      self.publish(courseId, true, request, response, callback);
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
      var archive = archiver('zip', { store: false });
      var output = fs.createWriteStream(exportDir +  '.zip');

      archive.on('error', callback);
      output.on('close', callback);
      archive.pipe(output);
      archive.bulk([{ expand: true, cwd: exportDir, src: ['**/*'] }]).finalize();

      var archive = archiver.create('zip', {}); // or archiver('zip', {});
    },
    function cleanUp(callback) {
      fse.remove(exportDir, function (error) {
        callback(error, { zipName: exportName + '.zip' });
      });
    }
  ],
  next);
};

function ImportError(message, httpStatus) {
  this.message = message || "Course import failed";
  this.httpStatus = httpStatus || 500;
};
util.inherits(ImportError, Error);

/*
* Wrapper for prepareImport and restoreData
*/
AdaptOutput.prototype.import = function (request, response, next) {
  var tenantId = usermanager.getCurrentUser().tenant._id;
  var COURSE_ROOT_FOLDER = path.join(configuration.tempDir, configuration.getConfig('masterTenantID'), Constants.Folders.Framework, Constants.Folders.AllCourses, tenantId);

  var form = IncomingForm();
  form.uploadDir = COURSE_ROOT_FOLDER;

  form.parse(request, function (error, fields, files) {
    if(error) return next(error);
    if(!files.file || !files.file.path) return next(new ImportError('File upload failed.'));

    var zipPath = files.file.path;
    var outputDir = zipPath + '_unzipped';
    prepareImport(zipPath, outputDir, function importPrepared(error) {
      if(error) return next(error);
      restoreData(outputDir, function dataRestored(error) {
        if(error) return next(error);
        response.status(200).json({ sucess: true, message: 'Successfully imported your course!' });
      });
    });
  });
};

/*
* 1. Unzips uploaded zip
* 2. Checks compatibility of import with this AT instance
* 3. Validates the import's metadata
* TODO Should we fail the task on every error?
*/
function prepareImport(zipPath, unzipPath, callback) {
  var decompress = require('decompress');
  new decompress()
    .src(zipPath)
    .dest(unzipPath)
    .use(decompress.zip({ strip: 0 }))
    .run(function onUnzipped(error, files) {
      if(error) return callback(error);
      async.parallel([
        function removeZip(asyncCallback) {
          fse.remove(zipPath, asyncCallback);
        },
        function checkVersionCompatibility(asyncCallback) {
          try {
            // TODO abstract this into framework helper
            var packageJson = require(path.join(unzipPath, 'package.json'));
          } catch(e) {
            return asyncCallback(new ImportError('Invalid import archive, no package.json found.', 400));
          }
          try {
            // TODO this data needs to be stored somewhere other than this file...
            var versionJson = require('../../../version.json');
          } catch(e) {
            return asyncCallback(e);
          }

          var importVersion = semver.clean(packageJson.version);
          var installedVersion = semver.clean(versionJson.adapt_framework);

          // TODO remove hard-coded error
          // TODO safe to assume installed framework has a valid version?
          if(!importVersion) return asyncCallback(new ImportError('Invalid version number (' + packageJson.version + ') found in import package.json'), 400)

          // check the import's within the major version number
          if(semver.satisfies(importVersion,semver.major(installedVersion).toString())) {
            asyncCallback();
          } else {
            // TODO remove hard-coded error
            asyncCallback(new ImportError('Import version (' + importVersion + ') not compatible with installed version (' + installedVersion + ')', 400));
          }
        },
        function validateMetadata(asyncCallback) {
          // TODO
          asyncCallback();
        }
      ], callback); // pass anything back? (e.g. metadata)
    });
};

// Recursively grabs all json content and returns an object
function getJSONRecursive(dir, doneRecursion) {
  var jsonRegEx = /\.json$/;
  var jsonData = {};
  fs.readdir(dir, function onRead(error, files) {
    if(error) return doneRecursion(error);
    async.each(files, function iterator(file, doneIteratee) {
      var newPath = path.join(dir, file);
      fs.stat(newPath, function(error, stats) {
        if(error) return doneIteratee(error);
        // if dir, do recursion
        if(stats.isDirectory()) {
          return getJSONRecursive(newPath, doneIteratee);
          // if json, load file and add to jsonData
        } else if(file.search(jsonRegEx) > -1) {
          var jsonKey = file.replace(jsonRegEx,'');
          if(!jsonData[jsonKey]) {
            try { jsonData[jsonKey] = require(newPath); }
            catch(e) { return doneIteratee(e); }
          }
          doneIteratee(jsonData);
        }
      });
    }, doneRecursion);
  });
};

/*
* 1. Loads and imports the course JSON
* 2. Imports the assets
* 3. Imports the plugins
*/
function restoreData(importDir, callback) {
  var app = origin();
  try {
    var metadataJson = require(path.join(importDir, 'metadata.json'));
  } catch e {
    return callback(e);
  }
  async.parallel([
    function loadCourseJson(asyncCallback) {
      // get all JSON from the course folder
      getJSONRecursive(path.join(importDir, 'src', 'course'), function onJsonLoaded(error, jsonData) {
        if(error) return asyncCallback(error);

        // now just need to import course JSON (jsonData)

        asyncCallback(null);
      });
    },
    // adapted from assetmanager.postAsset
    // TODO deal with filenames
    function importAssets(assetsImported) {
      var assetsDir = path.join(importDir, 'src', 'course', 'assets');
      fs.readdir(assetsDir, function(error, courseAssets) {
        console.log(courseAssets);

        async.each(courseAssets, function(assetName, callback) {
          var repository = configuration.getConfig('filestorage') || 'localfs';

          filestorage.getStorage(repository, function (error, storage) {
            if (error) return next(error);

            // VINYL FILE
            var file = {
              name: filename
              path: "path/in/unzip"
              type: mimeType
              size: size
            };
            var user = usermanager.getCurrentUser();
            var date = new Date();
            var hash = crypto.createHash('sha1');
            // think these options might be defaults?
            var rs = fs.createReadStream(file.path);

            rs.on('data', function (data) {
              hash.update(data, 'utf8');
            });
            rs.on('close', function () {
              var filehash = hash.digest('hex');
              var directory = path.join('assets', filehash.substr(0,2), filehash.substr(2,2));
              var filepath = path.join(directory, filehash) + path.extname(file.name);
              var fileOptions = {
                createMetadata: true,
                createThumbnail: true,
                thumbnailOptions: {
                  width: THUMBNAIL_WIDTH,
                  height: THUMBNAIL_HEIGHT
                }
              };

              // the repository should move the file to a suitable location
              storage.processFileUpload(file, filepath, fileOptions, function (error, storedFile) {
                if (error) return next(error);

                // It's better not to set thumbnailPath if it's not set.
                if (storedFile.thumbnailPath) storedFile.thumbnailPath = storedFile.thumbnailPath;
                var asset = _.extend(metadata, storedFile);

                // Create the asset record
                self.createAsset(asset,function (createError, assetRec) {
                  if (createError) {
                    storage.deleteFile(storedFile.path, callback);
                  }
                  else {
                    callback();
                  }
                });
              });
            });
          });
        }, assetsImported);
      });
    },
    function importPlugins(pluginsImported) {
      return pluginsImported();
      database.getDatabase(function (error, db) {
        if (error) return next(error);

        // TODO this is awful...get this from the metadata
        var pluginTypes = [
          ["components","component"],
          ["extensions","extension"],
          ["menu","menu"],
          ["theme","theme"]
        ];
        async.each(pluginTypes, function(pluginType, callback) {
          var pluginTypeDir = path.join(importDir, 'src', pluginType[0]);
          fs.readdir(pluginTypeDir, function(error, files) {
            async.each(files, function(file, callback) {
              var pluginDir = path.join(pluginTypeDir, file);
              try {
                var bowerJson = require(path.join(pluginDir, 'bower.json'));
              } catch(e) {
                return pluginsImported(e);
              }
              app.contentmanager.getContentPlugin(pluginType[1], function(error, plugin) {
                if(error) return pluginsImported(error);
                db.retrieve(plugin.bowerConfig.type, { name: bowerJson.name }, { jsonOnly: true }, function (error, records) {
                  // if(!records) {
                  if(true) {
                    console.log(bowerJson.displayName, ' not found, installing...');
                    bowerJson.isLocalPackage = true;
                    // do we need to check framework version on plugin at this point?
                    plugin.addPackage(contentPlugin.bowerConfig, {
                      canonicalDir: pluginDir,
                      pkgMeta: bowerJson
                    }, { strict: true }, pluginsImported);
                  } else {
                    var serverPlugin = records[0];
                    if(semver.gt(bowerJson.version,serverPlugin.version)) {
                      console.log('Import contains newer version of ' + bowerJson.displayName + ' (' + bowerJson.version + ') than server (' + serverPlugin.version + ')');
                    }
                    pluginsImported();
                  }
                });
              });
            }, callback);
          });
        }, pluginsImported);
      });
    }
  ], function doneAsync(error) {
    if(error) return callback(error);
    console.log('doneAsync, restoreData');
    callback();
  });
};

/**
 * Module exports
 *
 */

exports = module.exports = AdaptOutput;
