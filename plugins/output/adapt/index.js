// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
/**
 * Adapt Output plugin
 * TODO this file is too long. Suggest maybe splitting exports into separate files
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
    helpers = require('../../../lib/helpers'),
    logger = require('../../../lib/logger'),
    IncomingForm = require('formidable').IncomingForm,
    crypto = require('crypto'),
    glob = require('glob');

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
          var zipName = helpers.slugify(outputJson['course'].title);
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
      return next(err, resultObject);
    });
};

AdaptOutput.prototype.export = function (courseId, request, response, next) {
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
      var output = fs.createWriteStream(exportDir +  '.zip');
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
    if(error) {
      return next(error);
    }
    if(!files.file || !files.file.path) {
      return next(new ImportError('File upload failed.'));
    }
    var zipPath = files.file.path;
    var outputDir = zipPath + '_unzipped';
    prepareImport(zipPath, outputDir, function importPrepared(prepError, metadata) {
      if(error) {
        return cleanUpImport(outputDir, function(cleanupError) {
          next(prepError || cleanupError);
        });
      }
      metadata.importDir = outputDir;
      restoreData(metadata, function dataRestored(restoreError) {
        // clean up unzipped data, error or no
        cleanUpImport(outputDir, function(cleanupError) {
          if(restoreError || cleanupError) {
            return next(restoreError || cleanupError);
          }
          response.status(200).json({
            sucess: true,
            message: 'Successfully imported your course!'
          });
        });
      });
    });
  });
};

/*
* 1. Unzips uploaded zip
* 2. Checks compatibility of import with this AT instance
* 3. Validates the import's metadata
* TODO take out some of the nested functions
*/
function prepareImport(zipPath, unzipPath, callback) {
  var decompress = require('decompress');
  var metadata = {};
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
        function loadMetadata(asyncCallback) {
          try {
            metadata = require(path.join(unzipPath, 'metadata.json'));
          } catch(e) {
            return asyncCallback(new Error('No metadata found for import, please check the archive.'));
          }

          // TODO validation checks? (for manually created files)

          asyncCallback();
        }
      ], function doneAsync(error) {
        callback(error, metadata);
      });
    });
};

// Recursively grabs all json content and returns an object
function getJSONRecursive(dir, doneRecursion) {
  var jsonData = {};
  var jsonRegEx = /\.json$/;
  fs.readdir(dir, function onRead(error, files) {
    if(error) return doneRecursion(error);
    async.each(files, function iterator(file, doneIterator) {
      var newPath = path.join(dir, file);
      fs.stat(newPath, function(error, stats) {
        if(error) return doneIterator(error);
        // if dir, do recursion
        if(stats.isDirectory()) {
          getJSONRecursive(newPath, function(error, data) {
            _.extend(jsonData, data);
            doneIterator(error);
          });
          // if json, load file and add to jsonData
        } else if(file.search(jsonRegEx) > -1) {
          var jsonKey = file.replace(jsonRegEx,'');
          if(!jsonData[jsonKey]) {
            try { jsonData[jsonKey] = require(newPath); }
            catch(e) { return doneIterator(e); }
          }
          doneIterator(null, jsonData);
        } else {
          doneIterator();
        }
      });
    }, function(error) {
      doneRecursion(null, jsonData);
    });
  });
};

/*
* 1. Loads and imports the course JSON
* 2. Imports the assets
* 3. Imports the plugins
*/
function restoreData(metadata, callback) {
  var app = origin();
  async.parallel([
    function(cb) {
      restoreData(metadata, cb);
    },
    function(cb) {
      restoreAssets(metadata, cb);
    },
    function(cb) {
      importPlugins(metadata, cb);
    }
  ], function doneAsync(error) {
    if(error) return callback(error);
    callback();
  });
};

// TODO move these somewhere
function restoreCourseJson(metadata, loadedJson) {
  // get all JSON from the course folder
  getJSONRecursive(path.join(metadata.importDir, 'src', 'course'), function onJsonLoaded(error, jsonData) {
    if(error) return loadedJson(error);

    // now just need to import course JSON (jsonData)
    console.log(jsonData);

    loadedJson();
  });
};

// TODO adapted from assetmanager.postAsset (change this, don't like duplication)
// TODO deal with filenames
function importAssets(assetsImported) {
  var assetsGlob = path.join(metadata.importDir, 'src', 'course', '**', 'assets', '*');
  glob(assetsGlob, function (error, courseAssets) {
    if(error) {
      return assetsImported(error);
    }
    var repository = configuration.getConfig('filestorage') || 'localfs';
    filestorage.getStorage(repository, function gotStorage(error, storage) {
      if (error) {
        return assetsImported(error);
      }
      async.each(courseAssets, function iterator(assetPath, doneAsset) {
        if (error) {
          return doneAsset(error);
        }
        var assetName = path.basename(assetPath);
        var fileMeta = _.extend(metadata.assets[assetName], {
          filename: assetName,
          path: assetPath,
          repository: repository
        });

        if(!fileMeta) {
          return doneAsset(new Error('No metadata found for asset: ' + assetName));
        }

        // look for assets with the same name and size; chances are they're duplicates, so don't add
        app.assetmanager.retrieveAsset({ name: fileMeta.filename, size: fileMeta.size }, function gotAsset(error, results) {
          if(results) {
            console.log(fileMeta.filename, 'similar file found in DB, not importing');
            return doneAsset();
          }

          var date = new Date();
          var hash = crypto.createHash('sha1');
          var rs = fs.createReadStream(fileMeta.path);

          rs.on('data', function onReadData(data) {
            hash.update(data, 'utf8');
          });
          rs.on('close', function onReadClose() {
            var filehash = hash.digest('hex');
            var directory = path.join('assets', filehash.substr(0,2), filehash.substr(2,2));
            var filepath = path.join(directory, filehash) + path.extname(assetName);
            var fileOptions = {
              createMetadata: true,
              // TODO thumbnail
              createThumbnail: false
            };

            // the repository should move the file to a suitable location
            storage.processFileUpload(fileMeta, filepath, fileOptions, function onFileUploadProcessed(error, storedFile) {
              if (error) {
                return doneAsset(error);
              }
              // It's better not to set thumbnailPath if it's not set.
              if (storedFile.thumbnailPath) storedFile.thumbnailPath = storedFile.thumbnailPath;
              var asset = _.extend(fileMeta, storedFile);

              // Create the asset record
              app.assetmanager.createAsset(asset,function onAssetCreated(createError, assetRec) {
                if (createError) {
                  storage.deleteFile(storedFile.path, doneAsset);
                }
                else {
                  doneAsset();
                }
              });
            });
          });
        });
      }, assetsImported);
    });
  });
};

/**
* Installs any plugins which aren't already in the system.
* NOTE no action taken for plugins which are newer than installed version (just logged)
*/
function importPlugins(pluginsImported) {
  database.getDatabase(function gotDB(error, db) {
    if (error) {
      return pluginsImported(error);
    }
    /*
    * We need:
    * - content plugin name
    * - import folder
    * TODO get this from the metadata?
    */
    var pluginTypes = [
      { type: 'component', folder: 'components' },
      { type: 'extension', folder: 'extensions' },
      { type: 'menu',      folder: 'menu'       },
      { type: 'theme',     folder: 'theme'      }
    ];
    async.each(pluginTypes, function(pluginType, donePluginTypeIterator) {
      var pluginTypeDir = path.join(metadata.importDir, 'src', pluginType.folder);
      fs.readdir(pluginTypeDir, function onReadDir(error, files) {
        async.each(files, function(file, donePluginIterator) {
          var pluginDir = path.join(pluginTypeDir, file);
          try {
            var bowerJson = require(path.join(pluginDir, 'bower.json'));
          } catch(e) {
            return donePluginIterator(e);
          }
          app.contentmanager.getContentPlugin(pluginType.type, function onGotPlugin(error, plugin) {
            if(error) {
              return donePluginIterator(error);
            }
            db.retrieve(plugin.bowerConfig.type, { name: bowerJson.name }, { jsonOnly: true }, function (error, records) {
              if(records.length === 0) {
                console.log(bowerJson.displayName, ' not installed, installing...');
                bowerJson.isLocalPackage = true;
                // TODO do we need to check framework version on plugin at this point?
                plugin.addPackage(plugin.bowerConfig, { canonicalDir: pluginDir, pkgMeta: bowerJson }, { strict: true }, donePluginIterator);
              } else {
                var serverPlugin = records[0];
                // TODO what do we do with newer versions of plugins? (could affect other courses if we install new version)
                if(semver.gt(bowerJson.version,serverPlugin.version)) {
                  console.log('Import contains newer version of ' + bowerJson.displayName + ' (' + bowerJson.version + ') than server (' + serverPlugin.version + ')');
                }
                donePluginIterator();
              }
            });
          });
        }, donePluginTypeIterator);
      });
    }, pluginsImported);
  });
};

/*
* Just removes the unzipped files
*/
function cleanUpImport(importDir, doneCleanUp) {
  fse.remove(importDir, doneCleanUp)
};

/**
 * Module exports
 *
 */

exports = module.exports = AdaptOutput;
