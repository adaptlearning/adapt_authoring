var _ = require('underscore');
var async = require('async');
var configuration = require('../../../lib/configuration');
var Constants = require('../../../lib/outputmanager').Constants;
var crypto = require('crypto');
var database = require('../../../lib/database');
var filestorage = require('../../../lib/filestorage');
var fse = require('fs-extra');
var glob = require('glob');
var logger = require('../../../lib/logger');
var IncomingForm = require('formidable').IncomingForm;
var origin = require('../../../')();
var path = require('path');
var semver = require('semver');
var usermanager = require('../../../lib/usermanager');
var util = require('util');
var versionJson = require('../../../version');

function ImportError(message, httpStatus) {
  this.message = message || "Course import failed";
  this.httpStatus = httpStatus || 500;
};
util.inherits(ImportError, Error);

// the 'this' context for AdaptOutput
var ctx;

/**
* Course import function
* Wrapper for prepareImport and restoreData
* TODO implementation notes
* TODO need import configuration options (UI/forms) ????
* TODO hero images broken
*/

exports = module.exports = function Import(request, response, next) {
  ctx = this;
  var tenantId = usermanager.getCurrentUser().tenant._id;
  var COURSE_ROOT_FOLDER = path.join(configuration.tempDir, configuration.getConfig('masterTenantID'), Constants.Folders.Framework, Constants.Folders.AllCourses, tenantId);

  var cleanupDirs = [];

  async.waterfall([
    function courseFolderExists(cb) {
      fse.ensureDir(COURSE_ROOT_FOLDER, cb);
    },
    function parseForm(data, cb) {
      var form = IncomingForm();
      form.uploadDir = COURSE_ROOT_FOLDER;
      form.parse(request, cb);
    },
    function doPreparation(fields, files, cb) {
      if(!files.file || !files.file.path) {
        return cb(new ImportError('File upload failed.'));
      }
      var zipPath = files.file.path;
      var unzipPath = zipPath + '_unzipped';
      cleanupDirs.push(zipPath,unzipPath);
      prepareImport(zipPath, unzipPath, cb);
    },
    function doRestoration(pMetadata, cb) {
      restoreData(pMetadata, function(error) {
        cb(error, pMetadata);
      });
    }
  ], function doneWaterfall(error, metadata) {
    cleanUpImport(cleanupDirs, function(cleanupError) {
      if(error || cleanupError) {
        return next(error || cleanupError);
      }
      response.status(200).json({
        success: true,
        message: 'Successfully imported your course!'
      });
    });
  });
};

/*
* 1. Unzips uploaded zip
* 2. Checks compatibility of import with this AT instance
* 3. Validates the import's metadata
*/
function prepareImport(zipPath, unzipPath, callback) {
  var decompress = require('decompress');
  var d = new decompress()
    .src(zipPath)
    .dest(unzipPath)
    .use(decompress.zip({ strip: 0 }));
  d.run(function onUnzipped(error, files) {
    // TODO some zips give no file permissions...see: https://github.com/kevva/decompress/issues/24
    if(error) {
      return callback(error);
    }
    fse.stat(path.join(unzipPath, ctx.Constants.Filenames.Metadata), function gotStats(error, stats) {
      if(error) {
        if(error.code === 'ENOENT') {
          // TODO remove hard-coded error message
          return callback(new Error("Unable to load metadata. Please check archive is a valid import package."));
        }
        callback(error);
      }
      async.auto({
        removeZip: function(cb) {
          fse.remove(zipPath, cb);
        },
        loadMetadata: function(cb) {
          fse.readJson(path.join(unzipPath, ctx.Constants.Filenames.Metadata), function onJsonRead(error, metadata) {
            if(error) {
              // TODO any other possible errors?
              switch(error.name) {
                case 'SyntaxError':
                return cb(new Error('Import contains invalid metadata, please check the archive.'));
                default:
                return cb(new Error('No metadata found for import, please check the archive.'));
              }
            }
            cb(null, metadata);
          });
        },
        checkVersionCompatibility: ['loadMetadata', function(cb, data) {
          var metadata = data.loadMetadata;
          var installedVersion = semver.clean(versionJson.adapt_framework);
          var importVersion = semver.clean(metadata.version);

          metadata.importDir = unzipPath;

          // TODO remove hard-coded error
          if(!importVersion) {
            return cb(new ImportError('Invalid version number (' + importVersion + ') found in import package.json'), 400)
          }
          // check the import's within the major version number
          if(semver.satisfies(importVersion,semver.major(installedVersion).toString())) {
            cb();
          } else {
            // TODO remove hard-coded error
            cb(new ImportError('Import version (' + importVersion + ') not compatible with installed version (' + installedVersion + ')', 400));
          }
        }]
      }, function doneAuto(error, data) {
        callback(error, data.loadMetadata);
      });
    });
  });
};

/*
* 1. Loads and imports the course JSON
* 2. Imports the assets
* 3. Imports the plugins
*/
function restoreData(metadata, callback) {
  async.auto({
    importPlugins: function(cb) {
      importPlugins(metadata, cb);
    },
    importCourseJson: ['importPlugins', function(cb) {
      importCourseJson(metadata, cb);
    }],
    importAssets: ['importCourseJson', function(cb) {
      importAssets(metadata, cb);
    }],
    importCourseassets: ['importCourseJson', 'importAssets', function(cb) {
      importCourseassets(metadata, cb);
    }]
  }, function doneAuto(error) {
    if(error) {
      return removeImport(metadata, function doneCleanUp(cleanupError) {
        callback(cleanupError || error);
      });
    }
    callback();
  });
};

function importCourseJson(metadata, importedJson) {
  var userId = usermanager.getCurrentUser()._id;
  // HACK this is bad
  var oldCourseId = metadata.course.course[0]._id;
  var newCourseId;
  // HACK this is also bad...
  var order = [
    'course',
    'config',
    'contentobject',
    'article',
    'block',
    'component',
  ];

  // init the id map
  metadata.idMap = {};

  async.eachSeries(order, function typeIterator(courseKey, doneTypeIterator) {
    origin.contentmanager.getContentPlugin(courseKey, function gotContentPlugin(error, plugin) {
      if(error) {
        return doneTypeIterator(error);
      }
      async.each(metadata.course[courseKey], function itemIterator(json, doneItemIterator) {
        // memoise to keep the metadata as it is, omitting id
        var memo = _.omit(json, '_id');

        if(newCourseId) {
          // we're doing everything in order, so parent will have been mapped
          memo._parentId = metadata.idMap[json._parentId];
          memo._courseId = newCourseId;
        }
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
  }, importedJson);
};

// TODO adapted from assetmanager.postAsset (...don't duplicate...)
function importAssets(metadata, assetsImported) {
  var assetsGlob = path.join(metadata.importDir, ctx.Constants.Folders.Assets, '*');
  glob(assetsGlob, function (error, assets) {
    if(error) {
      return assetsImported(error);
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
        repository: repository
      });
      if(!fileMeta) {
        return doneAsset(new Error('No metadata found for asset: ' + assetName));
      }
      importAsset(fileMeta, metadata, doneAsset);
    }, assetsImported);
  });
};

function importAsset(fileMetadata, metadata, assetImported) {
  // if similar asset exists (same name and size), map ID to existing asset
  var search = {
    filename: fileMetadata.filename,
    size: fileMetadata.size
  };
  origin.assetmanager.retrieveAsset(search, function gotAsset(error, results) {
    if(results.length > 0) {
      logger.log('debug', fileMetadata.filename + ': similar file found in DB, not importing');
      metadata.idMap[fileMetadata.oldId] = results[0]._id;
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
      // TODO these vars are a bit dodgy
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
          origin.assetmanager.createAsset(asset, function onAssetCreated(createError, assetRec) {
            if (createError) {
              storage.deleteFile(storedFile.path, assetImported);
              return;
            }
            // store that asset was imported (used in cleanup if error)
            metadata.assets[assetRec.filename].wasImported = true;
            // add entry to the map
            metadata.idMap[fileMetadata.oldId] = assetRec._id;
            assetImported();
          });
        });
      });
    });
  });
};

function importCourseassets(metadata, courseassetsImported) {
  origin.contentmanager.getContentPlugin('courseasset', function(error, plugin) {
    async.each(metadata.courseassets, function(courseasset, createdCourseasset) {
      courseasset._courseId = metadata.idMap[courseasset._courseId];
      courseasset._assetId = metadata.idMap[courseasset._assetId];
      plugin.create(courseasset, createdCourseasset);
    }, courseassetsImported);
  });
};

/**
* Installs any plugins which aren't already in the system.
* NOTE no action taken for plugins which are newer than installed version (just logged)
*/
function importPlugins(metadata, pluginsImported) {
  var srcDir = path.join(metadata.importDir, ctx.Constants.Folders.Plugins);
  async.each(metadata.pluginIncludes, function(pluginData, donePluginIterator) {
    importPlugin(path.join(srcDir, pluginData.name), pluginData.type, donePluginIterator);
  }, pluginsImported);
};

function importPlugin(pluginDir, pluginType, pluginImported) {
  var bowerJson, contentPlugin;
  async.waterfall([
    function readBowerJson(cb) {
      fse.readJson(path.join(pluginDir, ctx.Constants.Filenames.Bower), cb);
    },
    function getContentPlugin(json, cb) {
      bowerJson = json;
      origin.contentmanager.getContentPlugin(pluginType, cb);
    },
    function getDB(plugin, cb) {
      contentPlugin = plugin;
      database.getDatabase(cb);
    },
    function retrievePluginDoc(db, cb) {
      db.retrieve(contentPlugin.bowerConfig.type, { name: bowerJson.name }, { jsonOnly: true }, cb);
    },
    function retrievePlugin(records, cb) {
      if(records.length === 0) {
        logger.log('info', bowerJson.displayName + ' not installed, installing...');
        bowerJson.isLocalPackage = true;
        // TODO do we need to check framework version on plugin at this point?
        contentPlugin.addPackage(contentPlugin.bowerConfig, { canonicalDir: pluginDir, pkgMeta: bowerJson }, { strict: true }, cb);
      } else {
        var serverPlugin = records[0];
        // TODO what do we do with newer versions of plugins? (could affect other courses if we install new version)
        if(semver.gt(bowerJson.version,serverPlugin.version)) {
          logger.log('info', 'Import contains newer version of ' + bowerJson.displayName + ' (' + bowerJson.version + ') than server (' + serverPlugin.version + ')');
        }
        cb();
      }
    }
  ], pluginImported);
};

/*
* Completely removes an imported course (i.e. course data, assets, plugins)
*/
function removeImport(metadata, doneRemove) {
  var newCourseId = metadata.idMap[metadata.course.course[0]._id];
  async.parallel([
    function deleteCourse(cb) {
      origin.contentmanager.getContentPlugin('course', function gotCoursePlugin(error, coursePlugin) {
        if(error) return cb(error);
        coursePlugin.destroy({ _id: newCourseId }, cb);
      });
    },
    // TODO this should be done by course.destroy
    function deleteCourseassets(cb) {
      database.getDatabase(function (error, db) {
        if(error) return cb(error);
        db.destroy('courseasset', { _courseId: newCourseId }, cb);
      });
    },
    function deleteAssets(cb) {
      var importedAssets = _.where(metadata.assets, { wasImported: true });
      async.each(importedAssets, function deleteAsset(asset, assetDeleted) {
        origin.assetmanager.destroyAsset(metadata.idMap[asset.oldId], assetDeleted);
      }, cb);
    },
    // TODO delete plugins
    function deletePlugins(cb) {
      cb();
    }
  ], doneRemove);
};

/*
* Just removes the unzipped files
*/
function cleanUpImport(dirs, doneCleanUp) {
  async.each(dirs, fse.remove, doneCleanUp);
};
