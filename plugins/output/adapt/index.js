// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
/**
 * Adapt Output plugin
 */
var _ = require('underscore');
var archiver = require('archiver');
var assetmanager = require('../../../lib/assetmanager');
var async = require('async');
var configuration = require('../../../lib/configuration');
var Constants = require('../../../lib/outputmanager').Constants;
var exec = require('child_process').exec;
var crypto = require('crypto');
var database = require('../../../lib/database');
var filestorage = require('../../../lib/filestorage');
var fs = require('fs');
var fse = require('fs-extra');
var glob = require('glob');
var helpers = require('../../../lib/helpers');
var IncomingForm = require('formidable').IncomingForm;
var logger = require('../../../lib/logger');
var mkdirp = require('mkdirp');
var ncp = require('ncp').ncp;
var origin = require('../../../')();
var OutputPlugin = require('../../../lib/outputmanager').OutputPlugin;
var path = require('path');
var rimraf = require('rimraf');
var semver = require('semver');
var usermanager = require('../../../lib/usermanager');
var util = require('util');
var version = require('../../../version');


function AdaptOutput() {
}
util.inherits(AdaptOutput, OutputPlugin);

var self;

/**
* FUNCTION: Publish
* ------------------------------------------------------------------------------
*/
AdaptOutput.prototype.publish = function(courseId, isPreview, request, response, next) {
  self = this;
  var user = usermanager.getCurrentUser(),
    tenantId = user.tenant._id,
    outputJson = {},
    isRebuildRequired = false,
    themeName = '',
    menuName = Constants.Defaults.MenuName;

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
        var assetsFolder = path.join(BUILD_FOLDER, Constants.Folders.Course, outputJson['config']._defaultLanguage, Constants.Folders.Assets);

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
        self.writeCourseJSON(outputJson, path.join(BUILD_FOLDER, Constants.Folders.Course), function(err) {
          if (err) {
            return callback(err);
          }

          callback(null);
        });
      },
      function(callback) {
        fs.exists(path.join(BUILD_FOLDER, Constants.Filenames.Main), function(exists) {
          if (!exists || isRebuildRequired) {
            logger.log('info', '3.1. Ensuring framework build exists');

            var args = [];
            var outputFolder = COURSE_FOLDER.replace(FRAMEWORK_ROOT_FOLDER + path.sep,'');

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
                  origin.emit('previewCreated', tenantId, courseId, outputFolder);

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
        self.clearBuildFlag(path.join(BUILD_FOLDER, Constants.Filenames.Rebuild), function(err) {
          callback(null);
        });
      },
      function(callback) {
        if (!isPreview) {
          // Now zip the build package
          var filename = path.join(COURSE_FOLDER, Constants.Filenames.Download);
          var zipName = helpers.slugify(outputJson['course'].title);
          var output = fs.createWriteStream(filename),
            archive = archiver('zip');

          output.on('close', function() {
            resultObject.filename = filename;
            resultObject.zipName = zipName;

            // Indicate that the zip file is ready for download
            origin.emit('zipCreated', tenantId, courseId, filename, zipName);

            callback();
          });
          archive.on('error', function(err) {
            logger.log('error', err);
            callback(err);
          });

          archive.pipe(output);

          archive.bulk([
            { expand: true, cwd: path.join(BUILD_FOLDER), src: ['**/*'] },
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
* FUNCTION: Import
* ------------------------------------------------------------------------------
*/

function ImportError(message, httpStatus) {
  this.message = message || "Course import failed";
  this.httpStatus = httpStatus || 500;
};
util.inherits(ImportError, Error);

/**
* Course import function
* Async wrapper for prepareImport and restoreData
* TODO implementation notes
*
* TODO hero images broken
* TODO need import configuration options (UI/forms) [not for MVP]
* TODO investigate strange error thrown due to inability to map courseasset to an asset id (see ln349)
*/

AdaptOutput.prototype.import = function(request, next) {
  self = this;

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
      next(error || cleanupError);
    });
  });
};

/*
* 1. Unzips uploaded zip
* 2. Validates the import's metadata
* 3. Checks compatibility of import with this AT instance
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
    async.auto({
      removeZip: function(cb) {
        fse.remove(zipPath, cb);
      },
      loadMetadata: function(cb) {
        fse.readJson(path.join(unzipPath, Constants.Filenames.Metadata), function onJsonRead(error, metadata) {
          if(error) {
            // TODO any other possible errors?
            switch(error.name) {
              case 'SyntaxError':
                return cb(new ImportError('Import contains invalid metadata, please check the archive.', 400));
              default:
                return cb(new ImportError('Unable to load metadata. Please check archive is a valid import package.', 400));
            }
          }
          // store this for later
          metadata.importDir = unzipPath;
          // make sure everything's in the right order for processing
          sortMetadata(metadata, cb);
        });
      },
      checkVersionCompatibility: ['loadMetadata', function(cb, data) {
        var metadata = data.loadMetadata;
        var installedVersion = semver.clean(version.adapt_framework);
        var importVersion = semver.clean(metadata.version);

        if(!importVersion) {
          return cb(new ImportError('Invalid version number (' + importVersion + ') found in import package.json'), 400)
        }
        // check the import's within the major version number
        if(semver.satisfies(importVersion,semver.major(installedVersion).toString())) {
          cb();
        } else {
          cb(new ImportError('Import version (' + importVersion + ') not compatible with installed version (' + installedVersion + ')', 400));
        }
      }]
    }, function doneAuto(error, data) {
      callback(error, data && data.loadMetadata);
    });
  });
};

/*
* Sorts in-place the metadata ABCs to make sure processing can happen
* (only needed for content objects currently)
*/
function sortMetadata(metadata, callback) {
  async.forEachOf(metadata.course, function iterator(item, type, cb) {
    switch(type) {
      case 'contentobject':
        var groups = _.groupBy(item, '_type');
        var sortedSections = sortContentObjects(groups.menu, metadata.course.course[0]._id, []);
        metadata.course[type] = sortedSections.concat(groups.page);
        break;
      default:
        break;
    }
    cb();
  }, function(error) {
    callback(error, metadata);
  });
};

/**
* Recursively sorts list to ensure parents come before children
*/
function sortContentObjects(list, parentId, sorted) {
  // remove parent
  var parentIndex = _.findIndex(list, { _id: parentId });
  if(parentIndex > -1) list.splice(_.findIndex(list, { _id: parentId }), 1);
  // recursively store children
  var thisChildren = _.where(list, { _parentId: parentId });
  _.each(thisChildren, function(child, index) {
    sorted.push(child);
    sortContentObjects(list, child._id, sorted);
  });
  return sorted;
};

/*
* Async wrapper for delegate functions
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
    importCourseassets: ['importAssets', function(cb) {
      importCourseassets(metadata, cb);
    }]
  }, function doneAuto(error) {
    if(error) {
      return removeImport(metadata, function ImportRemoved(removalError) {
        callback(removalError || error);
      });
    }
    callback(error);
  });
};

// TODO broken for sections?
function importCourseJson(metadata, importedJson) {
  var userId = usermanager.getCurrentUser()._id;
  var oldCourseId = metadata.course.course[0]._id;
  var newCourseId;
  // HACK this is bad
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
      async.eachSeries(metadata.course[courseKey], function itemIterator(json, doneItemIterator) {
        // memoise to keep the metadata as it is, omitting id
        var memo = _.omit(json, '_id');
        if(newCourseId) {
          // we're doing everything in hierarchy order, so should have a _parentId
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

function importAssets(metadata, assetsImported) {
  var assetsGlob = path.join(metadata.importDir, Constants.Folders.Assets, '*');
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
        repository: repository,
        createdBy: origin.usermanager.getCurrentUser()._id
      });
      if(!fileMeta) {
        return doneAsset(new ImportError('No metadata found for asset: ' + assetName));
      }
      importAsset(fileMeta, metadata, doneAsset);
    }, assetsImported);
  });
};

/**
* Adds asset to the DB
* Checks for a similar asset first (filename & size). if similar found, map that
* to the import course.
* TODO adapted from assetmanager.postAsset (...don't duplicate...)
*/
function importAsset(fileMetadata, metadata, assetImported) {
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
      // TODO get rid of hard-coded assets
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
  var srcDir = path.join(metadata.importDir, Constants.Folders.Plugins);
  async.each(metadata.pluginIncludes, function(pluginData, donePluginIterator) {
    importPlugin(path.join(srcDir, pluginData.name), pluginData.type, donePluginIterator);
  }, pluginsImported);
};

function importPlugin(pluginDir, pluginType, pluginImported) {
  var bowerJson, contentPlugin;
  async.waterfall([
    function readBowerJson(cb) {
      fse.readJson(path.join(pluginDir, Constants.Filenames.Bower), cb);
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
    function addPlugin(records, cb) {
      if(records.length === 0) {
        var serverVersion = semver.clean(version.adapt_framework);
        var pluginRange = semver.validRange(bowerJson.framework);
        // check the plugin's compatible with the framework
        if(semver.satisfies(serverVersion, pluginRange)) {
          logger.log('info', 'Installing', pluginType, "'" + bowerJson.displayName + "'");
          bowerJson.isLocalPackage = true;
          contentPlugin.addPackage(contentPlugin.bowerConfig, { canonicalDir: pluginDir, pkgMeta: bowerJson }, { strict: true }, cb);
        } else {
          logger.log('info', "Can't install " + bowerJson.displayName + ", it requires framework v" + pluginVersion + " (" + version.adapt_framework + " installed)");
          cb();
        }
      } else {
        var serverPlugin = records[0];
        // TODO what do we do with newer versions of plugins? (could affect other courses if we install new version)
        if(semver.gt(bowerJson.version,serverPlugin.version)) {
          logger.log('info', 'Import contains newer version of ' + bowerJson.displayName + ' (' + bowerJson.version + ') than server (' + serverPlugin.version + '), but not installing');
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
  // if there's no idMap, there's no course to delete
  var idsMapped = metadata.idMap !== undefined;
  var newCourseId = metadata.idMap && metadata.idMap[metadata.course.course[0]._id];
  async.parallel([
    function deleteCourse(cb) {
      if(!idsMapped) return cb();
      origin.contentmanager.getContentPlugin('course', function gotCoursePlugin(error, coursePlugin) {
        if(error) return cb(error);
        coursePlugin.destroy({ _id: newCourseId }, cb);
      });
    },
    // TODO this should be done by course.destroy
    function deleteCourseassets(cb) {
      if(!idsMapped) return cb();
      database.getDatabase(function (error, db) {
        if(error) return cb(error);
        db.destroy('courseasset', { _courseId: newCourseId }, cb);
      });
    },
    function deleteAssets(cb) {
      if(!idsMapped) return cb();
      var importedAssets = _.where(metadata.assets, { wasImported: true });
      async.each(importedAssets, function deleteAsset(asset, assetDeleted) {
        origin.assetmanager.destroyAsset(metadata.idMap[asset.oldId], assetDeleted);
      }, cb);
    },
    function deletePlugins(cb) {
      async.each(metadata.pluginIncludes, function(pluginData, donePluginIterator) {
        origin.bowermanager.destroyPlugin(pluginData.type, pluginData.name, donePluginIterator);
      }, cb);
    }
  ], doneRemove);
};

// deletes passed list of dirs/files
function cleanUpImport(dirs, doneCleanUp) {
  async.each(dirs, fse.remove, doneCleanUp);
};



/**
* FUNCTION: Export
* TODO need implementation notes
*      - metadata structure
*      - devMode param
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

AdaptOutput.prototype.export = function(pCourseId, devMode, request, response, pNext) {
  self = this;
  // store the params
  var currentUser = usermanager.getCurrentUser();
  COURSE_ROOT_DIR = path.join(FRAMEWORK_ROOT_DIR, Constants.Folders.AllCourses, currentUser.tenant._id, pCourseId);
  EXPORT_DIR = path.join(FRAMEWORK_ROOT_DIR, Constants.Folders.Exports, currentUser._id);
  courseId = pCourseId;
  next = pNext;

  // create the EXPORT_DIR if it isn't there
  fse.ensureDir(EXPORT_DIR, function(error) {
    if(error) {
      return next(error);
    }
    // export tasks vary based on type of export
    async.auto(devMode === 'true' ? {
      // dev export
      generateLatestBuild: generateLatestBuild,
      copyFrameworkFiles: ['generateLatestBuild', copyFrameworkFiles],
      copyCourseFiles: ['generateLatestBuild', copyCourseFiles]
    } : {
      // standard export
      generateMetadata: generateMetadata,
      copyCustomPlugins: ['generateMetadata', copyCustomPlugins],
      copyAssets: ['generateMetadata', copyAssets]
    }, zipExport);
  });

};

function generateLatestBuild(courseBuilt) {
  self.publish(courseId, true, null, null, courseBuilt);
};

/**
* Metadata functions
*/

// creates metadata.json file
function generateMetadata(generatedMetadata) {
  async.parallel([
    function(callback) {
      getPackageData(FRAMEWORK_ROOT_DIR, callback);
    },
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
    metadata = _.reduce(results, function(memo,result){ return _.extend(memo,result); });
    fse.writeJson(path.join(EXPORT_DIR, Constants.Filenames.Metadata), metadata, { spaces:0 }, generatedMetadata);
  });
};


// pulls out relevant attributes from package.json
function getPackageData(frameworkDir, gotPackageJson) {
  fse.readJson(path.join(frameworkDir, Constants.Filenames.Package), function onJsonRead(error, packageJson) {
    gotPackageJson(null, _.pick(packageJson, 'version'));
  });
};

// rips all course data from the DB
function getCourseMetdata(courseId, gotCourseMetadata) {
  database.getDatabase(function(error, db) {
    if (error) {
      return callback(error);
    }
    // metadata structure
    var metadata = {
      course: {}
    };

    async.each(Object.keys(Constants.CourseCollections), function iterator(collectionType, doneIterator) {
      var criteria = collectionType === 'course' ? { _id: courseId } : { _courseId: courseId };
      db.retrieve(collectionType, criteria, {operators: { sort: { _sortOrder: 1}}}, function dbRetrieved(error, results) {
        if (error) {
          gotCourseMetadata(doneIterator);
        }
        // only store the _doc values
        var toSave = _.pluck(results,'_doc');
        // store data, remove blacklisted properties
        // TODO make sure we're only saving what we need
        _.each(toSave, function(item, index) { toSave[index] = _.omit(item, blacklistedProps); });
        metadata.course[collectionType] = toSave;

        doneIterator();
      });
    }, function doneEach(error) {
      gotCourseMetadata(error, metadata);
    });
  }, usermanager.getCurrentUser().tenant._id);
};

function getAssetMetadata(courseId, gotAssetMetadata) {
  // metadata structure
  var metadata = {
    assets: {},
    courseassets: []
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
          if(!matchedAssets) {
            return doneIterator(new Error('No asset found with id: ' + courseasset._assetId));
          }
          if(matchedAssets.length > 1) {
            logger.log('info',"export.getAssetMetadata: multiple assets found with id", courseasset._assetId, "using first result");
          }
          var asset = matchedAssets[0];

          // would _.pick, but need to map some keys
          // TODO not ideal
          if(!metadata.assets[asset.filename]) {
            metadata.assets[asset.filename] = {
              "oldId": asset._id,
              "title": asset.title,
              "description": asset.description,
              "type": asset.mimeType,
              "size": asset.size
            };
          }
          // else console.log('Asset already stored:', asset.filename);

          // store the courseasset, omitting the blacklistedProps + _id
          var toOmit = blacklistedProps.concat([ "_id" ]);
          var courseassetData = _.omit(courseasset._doc, toOmit);
          metadata.courseassets.push(courseassetData);

          doneIterator();
        });
      }, function doneEach(error) {
        gotAssetMetadata(error, metadata);
      });
    });
  });
};

/**
* Generates:
* - A map for component types
* - List of plugins to include (i.e. plugins that have been manually updated,
*   or are completely custom)
*/
function getPluginMetadata(courseId, gotPluginMetadata) {
  /*
  * HACK there's got to be a way to get this info dynamically
  * We need:
  * - Content plugin name to see if it's already installed (so need plugin type)
  * - Plugin folder name to find plugin code (so need the plugin folder name -- maybe do this with a glob/search?)
  * (See Import.importPlugins for context)
  * For now, add map to metadata
  */
  var metadata = {
    pluginTypes: [
      { type: 'component', folder: 'components' },
      { type: 'extension', folder: 'extensions' },
      { type: 'menu',      folder: 'menu'       },
      { type: 'theme',     folder: 'theme'      }
    ],
    pluginIncludes: []
  };

  var includes;
  async.waterfall([
    function getIncludes(cb) {
      self.generateIncludesForCourse(courseId, cb);
    },
    function getDb(pIncludes, cb) {
      includes = pIncludes;
      database.getDatabase(cb);
    },
    function generateIncludes(db, cb) {
      async.each(metadata.pluginTypes, function iterator(pluginType, doneIterator) {
        db.retrieve(pluginType.type + 'type', { "isLocalPackage": true, "_isDeleted": false }, function gotTypeDoc(error, results) {
          if(error) {
            return cb(error);
          }
          async.each(results, function iterator(result, doneIterator2) {
            if(_.indexOf(includes, result.name) !== -1) {
              var data = _.extend(pluginType, { name: result.name });
              metadata.pluginIncludes.push(data);
            }
            doneIterator2();
          }, doneIterator);
        });
      }, cb);
    }
  ], function doneWaterfall(error) {
    gotPluginMetadata(error, metadata);
  });
};

/**
* Copy functions
*/

// copies relevant files in adapt_framework
function copyFrameworkFiles(filesCopied) {
  self.generateIncludesForCourse(courseId, function(error, includes) {
    if(error) {
      return includesGenerated(error);
    }
    // create list of includes
    for(var i = 0, count = includes.length; i < count; i++)
      includes[i] = '\/' + includes[i] + '(\/|$)';

    var includesRE = new RegExp(includes.join('|'));
    var excludesRE = new RegExp(/\.git\b|\.DS_Store|\/node_modules|\/courses\b|\/course\b|\/exports\b/);
    var pluginsRE = new RegExp('\/components\/|\/extensions\/|\/menu\/|\/theme\/');

    fse.copy(FRAMEWORK_ROOT_DIR, EXPORT_DIR, {
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
        return filesCopied(error);
      }
      copyCourseFiles(filesCopied);
    });
  });
};

// uses the metadata list to include only relevant plugin files
function copyCustomPlugins(filesCopied) {
  var src = path.join(FRAMEWORK_ROOT_DIR, Constants.Folders.Source);
  var dest = path.join(EXPORT_DIR, Constants.Folders.Plugins);
  async.each(metadata.pluginIncludes, function iterator(plugin, cb) {
    var pluginDir = path.join(src, plugin.folder, plugin.name);
    fse.copy(pluginDir, path.join(dest, plugin.name), cb);
  }, filesCopied);
};

// copies everything in the course folder
function copyCourseFiles(filesCopied) {
  var source = path.join(COURSE_ROOT_DIR, Constants.Folders.Build, Constants.Folders.Course);
  var dest = path.join(EXPORT_DIR, Constants.Folders.Source, Constants.Folders.Course);
  fse.ensureDir(dest, function(error) {
    if (error) {
      return filesCopied(error);
    }
    fse.copy(source, dest, filesCopied);
  });
};

// copies used assets directly from the data folder
function copyAssets(assetsCopied) {
  var dest = path.join(EXPORT_DIR, Constants.Folders.Assets);
  fse.ensureDir(dest, function(error) {
    if (error) {
      return filesCopied(error);
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
          fse.copy(srcPath, destPath, doneIterator);
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
  var output = fse.createWriteStream(EXPORT_DIR +  '.zip');
  archive.on('error', cleanUpExport);
  output.on('close', cleanUpExport);
  archive.pipe(output);
  archive.bulk([{ expand: true, cwd: EXPORT_DIR, src: ['**/*'] }]).finalize();
};

// remove the EXPORT_DIR, if there is one
function cleanUpExport(exportError) {
  fse.remove(EXPORT_DIR, function(removeError) {
    next(exportError || removeError);
  });
};

/**
 * Module exports
 *
 */

exports = module.exports = AdaptOutput;
