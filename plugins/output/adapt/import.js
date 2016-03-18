var origin = require('../../../')();
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
* TODO hero images broken
* TODO cannot import if course with same ID already exists
* TODO import course data first, so there's less cleanup after error
* TODO convert consoles to loggers
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
    prepareImport(zipPath, outputDir, function importPrepared(prepError, data) {
      if(error) {
        return cleanUpImport(outputDir, function(cleanupError) {
          next(prepError || cleanupError);
        });
      }
      data.importDir = outputDir;
      restoreData(data, function dataRestored(restoreError) {
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
  new decompress()
    .src(zipPath)
    .dest(unzipPath)
    .use(decompress.zip({ strip: 0 }))
    .run(function onUnzipped(error, files) {
      if(error) {
        return callback(error);
      }
      async.parallel([
        function removeZip(asyncCallback) {
          fse.remove(zipPath, asyncCallback);
        },
        function checkVersionCompatibility(asyncCallback) {
          // TODO abstract this into framework helper
          fse.readJson(path.join(unzipPath, 'package.json'), function onJsonRead(error, packageJson) {
            if(error) {
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
          });
        },
        function loadMetadata(asyncCallback) {
          fse.readJson(path.join(unzipPath, 'metadata.json'), function onJsonRead(error, metadata) {
            if(error) {
              switch(error.name) {
                case 'SyntaxError':
                return asyncCallback(new Error('Import contains invalid metadata, please check the archive.'));
                default:
                return asyncCallback(new Error('No metadata found for import, please check the archive.'));
              }
            }
            asyncCallback(null, metadata);
          });
        },
        // get all JSON from the course folder
        function loadCourseData(asyncCallback) {
          getJSONRecursive(path.join(unzipPath, 'src', 'course'), asyncCallback);
        }
      ], function(error, data) {
        if(error) {
          return callback(error);
        }
        // TODO assume both return something? (or otherwise an error)
        callback(null, {
          metadata: data[2],
          course: data[3]
        });
      });
    });
};

// Recursively grabs all json content and returns an object
function getJSONRecursive(dir, doneRecursion) {
  var jsonData = {};
  var jsonRegEx = /\.json$/;
  fse.readdir(dir, function onRead(error, files) {
    if(error) {
      return doneRecursion(error);
    }
    async.each(files, function iterator(file, doneIterator) {
      var newPath = path.join(dir, file);
      fse.stat(newPath, function(error, stats) {
        if(error) {
          return doneIterator(error);
        }
        // if dir, do recursion
        if(stats.isDirectory()) {
          getJSONRecursive(newPath, function(error, data) {
            _.extend(jsonData, data);
            doneIterator(error);
          });
          // if json, load file and add to jsonData
        } else if(file.search(jsonRegEx) > -1) {
          fse.readJson(newPath, function onJsonRead(error, fileJson) {
            if(error) {
              return doneIterator(error);
            }
            var type = fileJson._type || fileJson[0] && fileJson[0]._type || 'config';
            if(!type) {
              console.log('No type found for', file);
              return doneIterator();
            }
            if(!jsonData[type]) jsonData[type] = fileJson;
            doneIterator(null, jsonData);
          });
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
function restoreData(data, callback) {
  // TODO parallelise this somehow (note that we need the courseId in importCourseassets)
  async.series([
    function(cb) {
      importCourseJson(data, cb);
    },
    function(cb) {
      importAssets(data, cb);
    },
    function(cb) {
      importCourseassets(data, cb);
    },
    function(cb) {
      importPlugins(data, cb);
    }
  ], function doneAsync(error) {
    if(error) {
      return removeImport(data, callback);
    }
    callback();
  });
};

function importCourseJson(data, importedJson) {
  var userId = usermanager.getCurrentUser()._id;
  // TODO this is bad
  var oldCourseId = data.metadata.course.course[0]._id;
  var newCourseId;
  // TODO this is also bad...
  var order = [
    'course',
    'config',
    'contentobject',
    'article',
    'block',
    'component',
  ];

  // init the id map
  data.idMap = {};

  async.eachSeries(order, function typeIterator(courseKey, doneTypeIterator) {
    origin.contentmanager.getContentPlugin(courseKey, function gotContentPlugin(error, plugin) {
      if(error) {
        return doneTypeIterator(error);
      }
      async.each(data.metadata.course[courseKey], function itemIterator(json, doneItemIterator) {
        var oldId = json._id;
        var oldParentId = json._parentId;
        delete json._id;

        // as we're doing everything in order, we know the parent will have been mapped (and if no courseId, there will be no parent)
        if(newCourseId) {
          json._courseId = newCourseId;
          json._parentId = data.idMap[oldParentId];
        }

        json.createdBy = userId;

        plugin.create(json, function onCreated(error, newDoc) {
          if(error) {
            return doneItemIterator(error);
          }
          var newObj = newDoc.toObject();
          // must be a course
          if(!newCourseId) {
            newCourseId = newObj._id;
          }
          data.idMap[oldId] = newObj._id;
          doneItemIterator();
        });
      }, doneTypeIterator);
    });
  }, importedJson);
};

// TODO adapted from assetmanager.postAsset (change this, don't like duplication)
// TODO deal with filenames
function importAssets(data, assetsImported) {
  var assetsGlob = path.join(data.importDir, 'src', 'course', '**', 'assets', '*');
  glob(assetsGlob, function (error, assets) {
    if(error) {
      return assetsImported(error);
    }
    var repository = configuration.getConfig('filestorage') || 'localfs';
    async.each(assets, function iterator(assetPath, doneAsset) {
      if (error) {
        return doneAsset(error);
      }
      var assetName = path.basename(assetPath);
      // TODO look into creating a vinyl file here
      var fileMeta = _.extend(data.metadata.assets[assetName], {
        filename: assetName,
        path: assetPath,
        repository: repository
      });
      if(!fileMeta) {
        return doneAsset(new Error('No metadata found for asset: ' + assetName));
      }
      importAsset(fileMeta, data, doneAsset);
    }, assetsImported);
  });
};

function importAsset(fileMetadata, data, assetImported) {
  // look for assets with the same name and size; chances are they're duplicates, so don't add
  origin.assetmanager.retrieveAsset({ name: fileMetadata.filename, size: fileMetadata.size }, function gotAsset(error, results) {
    if(results.length > 0) {
      console.log(fileMetadata.filename, 'similar file found in DB, not importing');
      return assetImported();
    }

    var date = new Date();
    var hash = crypto.createHash('sha1');
    var rs = fse.createReadStream(fileMetadata.path);

    rs.on('data', function onReadData(pData) {
      hash.update(pData, 'utf8');
    });
    rs.on('close', function onReadClose() {
      var filehash = hash.digest('hex');
      var directory = path.join('assets', filehash.substr(0,2), filehash.substr(2,2));
      var filepath = path.join(directory, filehash) + path.extname(fileMetadata.filename);
      var fileOptions = {
        createMetadata: true,
        // TODO thumbnail
        createThumbnail: false
      };
      filestorage.getStorage(fileMetadata.repository, function gotStorage(error, storage) {
        if (error) {
          return assetImported(error);
        }
        // the repository should move the file to a suitable location
        storage.processFileUpload(fileMetadata, filepath, fileOptions, function onFileUploadProcessed(error, storedFile) {
          if (error) {
            return assetImported(error);
          }
          // It's better not to set thumbnailPath if it's not set.
          if (storedFile.thumbnailPath) storedFile.thumbnailPath = storedFile.thumbnailPath;
          var asset = _.extend(fileMetadata, storedFile);

          // Create the asset record
          origin.assetmanager.createAsset(asset,function onAssetCreated(createError, assetRec) {
            if (createError) {
              storage.deleteFile(storedFile.path, assetImported);
              return;
            }
            // add entry to the map
            data.idMap[fileMetadata.oldId] = assetRec._id;

            assetImported();
          });
        });
      });
    });
  });
};

function importCourseassets(data, courseassetsImported) {
  origin.contentmanager.getContentPlugin('courseasset', function(error, plugin) {
    async.each(data.metadata.courseassets, function(courseasset, createdCourseasset) {
      console.log(data.idMap[courseasset._assetId]);
      courseasset._courseId = data.idMap[courseasset._courseId];
      courseasset._assetId = data.idMap[courseasset._assetId];
      plugin.create(courseasset, createdCourseasset);
    }, courseassetsImported);
  });
};

/**
* Installs any plugins which aren't already in the system.
* NOTE no action taken for plugins which are newer than installed version (just logged)
*/
function importPlugins(data, pluginsImported) {
  async.each(data.metadata.pluginTypes, function(pluginType, donePluginTypeIterator) {
    var pluginTypeDir = path.join(data.importDir, 'src', pluginType.folder);
    fse.readdir(pluginTypeDir, function onReadDir(error, files) {
      async.each(files, function(file, donePluginIterator) {
        var pluginDir = path.join(pluginTypeDir, file);
        importPlugin(pluginDir, pluginType.type, donePluginIterator);
      }, donePluginTypeIterator);
    });
  }, pluginsImported);
};

function importPlugin(pluginDir, pluginType, pluginImported) {
  fse.readJson(path.join(pluginDir, 'bower.json'), function onJsonRead(error, bowerJson) {
    if(error) {
      return pluginImported(error);
    }
    origin.contentmanager.getContentPlugin(pluginType, function onGotPlugin(error, plugin) {
      if(error) {
        return pluginImported(error);
      }
      database.getDatabase(function gotDB(error, db) {
        if (error) {
          return pluginsImported(error);
        }
        db.retrieve(plugin.bowerConfig.type, { name: bowerJson.name }, { jsonOnly: true }, function (error, records) {
          if(records.length === 0) {
            console.log(bowerJson.displayName, ' not installed, installing...');
            bowerJson.isLocalPackage = true;
            // TODO do we need to check framework version on plugin at this point?
            plugin.addPackage(plugin.bowerConfig, { canonicalDir: pluginDir, pkgMeta: bowerJson }, { strict: true }, pluginImported);
          } else {
            var serverPlugin = records[0];
            // TODO what do we do with newer versions of plugins? (could affect other courses if we install new version)
            if(semver.gt(bowerJson.version,serverPlugin.version)) {
              console.log('Import contains newer version of ' + bowerJson.displayName + ' (' + bowerJson.version + ') than server (' + serverPlugin.version + ')');
            } /*else {
              console.log('Import version of ' + bowerJson.displayName + ' (' + bowerJson.version + ') not newer than server (' + serverPlugin.version + '), nothing to do');
            }*/
            pluginImported();
          }
        });
      });
    });
  });
};

// called after import error
function removeImport(data, doneRemove) {
  // importCourseJson
  // importAssets
  // importCourseassets
  // importPlugins
  console.log(data);
};

/*
* Just removes the unzipped files
*/
function cleanUpImport(importDir, doneCleanUp) {
  fse.remove(importDir, doneCleanUp)
};
