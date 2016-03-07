var origin = require('../../../');
var Constants = require('../../../lib/outputmanager').Constants;
var configuration = require('../../../lib/configuration');
var filestorage = require('../../../lib/filestorage');
var database = require('../../../lib/database');
var util = require('util');
var path = require('path');
var fse = require('fs-extra');
var async = require('async');
var _ = require('underscore');
var usermanager = require('../../../lib/usermanager');
var semver = require('semver');
var version = require('../../../version');
var IncomingForm = require('formidable').IncomingForm;
var crypto = require('crypto');
var glob = require('glob');

function ImportError(message, httpStatus) {
  this.message = message || "Course import failed";
  this.httpStatus = httpStatus || 500;
};
util.inherits(ImportError, Error);

/**
* Course import function
* Wrapper for prepareImport and restoreData
* TODO notes?
*/

exports = module.exports = function Import(request, response, next) {
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
          var importVersion = semver.clean(packageJson.version);
          var installedVersion = semver.clean(version.adapt_framework);

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

/*
* 1. Loads and imports the course JSON
* 2. Imports the assets
* 3. Imports the plugins
*/
function restoreData(metadata, callback) {
  var app = origin();
  async.parallel([
    function(cb) {
      importCourseJson(metadata, cb);
    },
    function(cb) {
      importAssets(metadata, cb);
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
function importCourseJson(metadata, importedJson) {
  // get all JSON from the course folder
  getJSONRecursive(path.join(metadata.importDir, 'src', 'course'), function onJsonLoaded(error, jsonData) {
    if(error) return importedJson(error);

    // now just need to import course JSON (jsonData)
    console.log(jsonData);

    importedJson();
  });
};

// Recursively grabs all json content and returns an object
function getJSONRecursive(dir, doneRecursion) {
  var jsonData = {};
  var jsonRegEx = /\.json$/;
  fse.readdir(dir, function onRead(error, files) {
    if(error) return doneRecursion(error);
    async.each(files, function iterator(file, doneIterator) {
      var newPath = path.join(dir, file);
      fse.stat(newPath, function(error, stats) {
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

// TODO adapted from assetmanager.postAsset (change this, don't like duplication)
// TODO deal with filenames
function importAssets(metadata, assetsImported) {
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
          var rs = fse.createReadStream(fileMeta.path);

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
function importPlugins(metadata, pluginsImported) {
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
      fse.readdir(pluginTypeDir, function onReadDir(error, files) {
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
