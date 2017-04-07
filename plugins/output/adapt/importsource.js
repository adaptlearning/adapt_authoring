// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
var _ = require('underscore');
var async = require('async');
var fs = require("fs-extra");
var path = require("path");
var IncomingForm = require('formidable').IncomingForm;

var database = require("../../../lib/database");
var logger = require("../../../lib/logger");
var Constants = require('../../../lib/outputmanager').Constants;
var helpers = require('./helpers');
var mime = require('mime');
var glob = require('glob');
var crypto = require('crypto');
var filestorage = require('../../../lib/filestorage');

// TODO integrate with sockets API to show progress

function ImportSource(req, done) {
  var contentMap = {
    'contentobject': 'contentObjects',
    'article': 'articles',
    'block': 'blocks',
    'component': 'components'
  };
  // TODO - move this to outputmanager.Constants see ./index.js line 492
  var plugindata = {
    pluginTypes: [
      { type: 'component', folder: 'components' },
      { type: 'extension', folder: 'extensions' },
      { type: 'menu',      folder: 'menu'       },
      { type: 'theme',     folder: 'theme'      }
    ],
    pluginIncludes: []
  };
  var idMap = {};
  var componentMap = {};
  var extensionMap = {};
  var extensionLocations = {};
  var enabledExtensions = {};
  var tenantId = app.usermanager.getCurrentUser().tenant._id;
  var unzipFolder = tenantId + '_unzipped';
  var COURSE_ROOT_FOLDER = path.join(configuration.tempDir, configuration.getConfig('masterTenantID'), Constants.Folders.Framework, Constants.Folders.AllCourses, tenantId, unzipFolder);
  var courseRoot = path.join(COURSE_ROOT_FOLDER, 'src', 'course', 'en' );
  var form = new IncomingForm();
  var origCourseId;
  var courseId;
  var cleanupDirs = [];


  form.parse(req, function (error, fields, files) {

    if (error) return next(error);

    var formTags = (fields.tags && fields.tags.length) ? fields.tags.split(',') : [];

    /**
    * Main process
    * All functions delgated below for readability
    */
    async.series([
      function asyncUnzip(cb) {
        // socket unzipping files
        helpers.unzip(files.file.path, COURSE_ROOT_FOLDER, function(error) {
          if(error) return cb(error);
          // socket files unzipped
          var zipPath = files.file.path;
          cleanupDirs.push(zipPath,COURSE_ROOT_FOLDER);
          cb();
        });
      },
      function asyncValidate(cb) {
        // socket validating package
        validateCoursePackage(function(error) {
          if(error) return cb(error);
          // socket package passed validation
          cb();
        });
      },
      function asyncInstallPlugins(cb) {
        // socket installing custom plugins
        installPlugins(function(error) {
          if(error) return cb(error);
          // socket custom plugins installed
          cb();
        });
      },
      function asyncAddAssets(cb) {
        // socket importing assets
        addAssets(formTags, function(error) {
          if(error) return cb(error);
          // socket assets imported
          cb();
        });
      },
      function asyncCacheMetadata(cb) {
        cacheMetadata(cb);
      },
      function asyncImportContent(cb) {
        // socket importing course content
        importContent(formTags, function(error) {
          if(error) return cb(error);
          // socket course content imported successfully
          cb();
        });
      },
      function cleanUpTasks(cb) {
        helpers.cleanUpImport(cleanupDirs, cb);
      }
    ], done);
  });



  /**
  * Checks course for any potential incompatibilities
  */
  function validateCoursePackage(done) {
    // - Check framework version compatibility
    // - check we have all relevant json files using contentMap
    async.auto({
      checkFramework: function(cb) {
        fs.readJson(path.join(COURSE_ROOT_FOLDER, 'package.json'), function(error, versionJson) {
          if(error) {
            logger.log('error', error)
            return cb(error);
          }
          helpers.checkFrameworkVersion(versionJson, cb);
        });
      },
      checkContentJson: ['checkFramework', function(cb) {
        async.eachSeries(Object.keys(contentMap), function(type, cb2) {
          fs.readJson(path.join(courseRoot, contentMap[type] + '.json'), function(error, contentJson) {
            if(error) {
              logger.log('error', error)
              return cb2(error);
            }
            cb2();
            // TODO Question - do we need to validate any further?
          });
        }, cb);
      }]
    }, function doneAuto(error, data) {
      done(error);
    });
  }

  /**
  * Imports assets to the library
  */
  function addAssets(assetTags, done) {
    // TODO - need to deal with asset location path in a less hacky way. Also include other languages/folders
    var assetsGlob = path.join(COURSE_ROOT_FOLDER, Constants.Folders.Source, Constants.Folders.Course, 'en', Constants.Folders.Assets, '*');
    glob(assetsGlob, function (error, assets) {
      if(error) {
        return cb(error);
      }
      var repository = configuration.getConfig('filestorage') || 'localfs';
      async.eachSeries(assets, function iterator(assetPath, doneAsset) {
        if (error) {
          return doneAsset(error);
        }
        var assetName = path.basename(assetPath);
        var assetExt = path.extname(assetPath);
        var assetId = path.basename(assetPath, assetExt);
        var fileStat = fs.statSync(assetPath);

        // TODO - description is required and should be something more meaningful
        var fileMeta = {
          oldId: assetId,
          title: assetName,
          type: mime.lookup(assetName),
          size: fileStat["size"],
          filename: assetName,
          description: assetName,
          path: assetPath,
          tags: assetTags,
          repository: repository,
          createdBy: app.usermanager.getCurrentUser()._id
        };

        if(!fileMeta) {
          return doneAsset(new helpers.ImportError('No metadata found for asset: ' + assetName));
        }
        importSourceAsset(fileMeta, idMap, doneAsset);
      }, done);
    });
  }

  /**
  * Installs any custom plugins
  */
  function installPlugins(done) {
    async.series([
      function mapPluginIncludes(cb) {
        async.each(plugindata.pluginTypes, function iterator(pluginType, doneMapIterator) {

          var srcDir = path.join(COURSE_ROOT_FOLDER, 'src', pluginType.folder);
          fs.readdir(srcDir, function (err, files) {
              if (err) {
                done(err);
              }
              files.map(function (file) {
                return path.join(srcDir, file);
              }).filter(function (file) {
                return fs.statSync(file).isDirectory();
              }).forEach(function (file) {
                var thisPluginType = _.clone(pluginType);
                var data = _.extend(thisPluginType, { location: file });
                plugindata.pluginIncludes.push(data);
              });
          });
          doneMapIterator();
        }, cb);
      },
      function importPlugins(cb) {
        async.each(plugindata.pluginIncludes, function(pluginData, donePluginIterator) {
          helpers.importPlugin(pluginData.location, pluginData.type, donePluginIterator);
        }, cb);
      },
    ], function(error, results) {
      done(error);
    });
  }

  /**
  * Stores plugin metadata for use later
  */
  function cacheMetadata(done) {
    database.getDatabase(function(error, db) {
      if(error) return cb(error);
      async.parallel([
        function storeComponentypes(cb) {
          db.retrieve('componenttype', {}, { jsonOnly: true }, function(error, results) {
            if(error) return cb(error);
            async.each(results, function(component, cb2) {

              componentMap[component.component] = component._id;
              cb2();
            }, cb);
          });
        },
        function storeExtensiontypes(cb) {
          db.retrieve('extensiontype', {}, { jsonOnly: true }, function(error, results) {
            if(error) return cb(error);
            async.each(results, function(extension, cb2) {
              extensionMap[extension.extension] = extension._id;
              if(extension.properties.pluginLocations) {
                extensionLocations[extension.targetAttribute] = extension.properties.pluginLocations;
              }
              cb2();
            }, cb);
          });
        },
      ], done);
    });
  }

  /**
  * Creates the course content
  */
  function importContent(formTags, done) {
    async.series([
      function createCourse(cb) {
        fs.readJson(path.join(courseRoot, 'course.json'), function(error, courseJson) {
          if(error) return cb(error);
          courseJson = _.extend(courseJson, { _isShared: false, tags: formTags }); // TODO remove this later
          createContentItem('course', courseJson, '', function(error, courseRec) {
            if(error) return cb(error);
            origCourseId = courseJson._id;
            courseId = idMap[origCourseId] = courseRec._id;
            cb();
          });
        });
      },
      function createCourse(cb) {
        fs.readJson(path.join(COURSE_ROOT_FOLDER, 'src', 'course', 'config.json'), function(error, configJson) {
          if(error) return cb(error);
          createContentItem('config', configJson, courseId, cb);
        });
      },
      function enableExtensions(cb) {
        // TODO this function should be surfaced properly somewhere
        async.eachSeries(plugindata.pluginIncludes, function(pluginData, doneItemIterator) {
          if (pluginData.type == 'extension') {
            fs.readJson(path.join(pluginData.location, Constants.Filenames.Bower), function(error, extensionJson) {
              if(error) return cb(error);
              enabledExtensions[extensionJson.extension] = extensionMap[extensionJson.extension];
              doneItemIterator();
            });
          } else {
            doneItemIterator();
          }
        }, function(error) {
          if(error) return cb(error);
          app.contentmanager.toggleExtensions(courseId.toString(), 'enable', _.values(enabledExtensions), cb);
        });
      },
      function createContent(cb) {
        async.eachSeries(Object.keys(contentMap), function(type, cb2) {
          app.contentmanager.getContentPlugin(type, function(error, plugin) {
            if(error) return cb2(error);
            fs.readJson(path.join(courseRoot, contentMap[type] + '.json'), function(error, contentJson) {
              if(error) return cb2(error);

              // TODO - contenoObjects could do with sorting by parentId not just menu/page
              // Sorts in-place the content objects to make sure processing can happen
              if (type == 'contentobject') {
                var groups = _.groupBy(contentJson, '_type');
                var sortedSections = helpers.sortContentObjects(groups.menu, origCourseId, []);
                contentJson = sortedSections.concat(groups.page);
              }

              // assume we're using arrays
              async.eachSeries(contentJson, function(item, cb3) {
                createContentItem(type, item, courseId, function(error, contentRec) {
                  if(error) return cb3(error);
                  idMap[item._id] = contentRec._id;
                  cb3();
                });
              }, cb2);
            });
          });
        }, cb);
      }
    ], done);
  }

  // TODO update any ids in custom attributes
  // TODO create assets
  function createContentItem(type, originalData, courseId, done) {
    // data needs to be transformed a bit first
    var data = _.extend({}, originalData);

    delete data._id;
    delete data._trackingId;
    delete data._latestTrackingId;
    data.createdBy = app.usermanager.getCurrentUser()._id;
    if(!_.isEmpty(courseId)) data._courseId = courseId;
    if(data._component) {
      data._componentType = componentMap[data._component];
    }
    if(data._parentId) {
      if(idMap[data._parentId]) {
        data._parentId = idMap[data._parentId];
      } else {
        logger.log('warn', 'Cannot update ' + originalData._id + '._parentId, ' +  originalData._parentId + ' not found in idMap');
      }
    }
    // define the custom properties and _extensions
    database.getDatabase(function(error, db) {
      var genericPropKeys = Object.keys(db.getModel(type).schema.paths);
      var customProps = _.pick(data, _.difference(Object.keys(data), genericPropKeys));
      var extensions = _.pick(customProps, _.intersection(Object.keys(customProps),Object.keys(extensionLocations)));
      customProps = _.omit(customProps, Object.keys(extensions));
      data.properties = customProps
      data._extensions = extensions;
      data = _.omit(data, Object.keys(customProps));
      // now we're ready to creat the content
      app.contentmanager.getContentPlugin(type, function(error, plugin) {
        if(error) return done(error);
        plugin.create(data, function(error, record) {
          if(error) {
            logger.log('warn', 'Failed to import ' + type + ' ' + (originalData._id || '') + ' ' + error);
            return done(); // TODO collect failures, maybe try again
          }
          logger.log('debug', 'imported ' + type + ' ' + (originalData._id || '') + ' successfully');
          done(null, record);
        });
      });
    });
  }
}


/**
* Adds asset to the DB
* Checks for a similar asset first (filename & size). if similar found, map that
* to the import course.
* TODO don't duplicate, similar to helpers.importAsset and assetmanager.postAsset
* @param {object} fileMetadata
* @param {object} idMap
* @param {callback} assetImported
*/
function importSourceAsset(fileMetadata, idMap, assetImported) {
  var search = {
    filename: fileMetadata.filename,
    size: fileMetadata.size
  };
  app.assetmanager.retrieveAsset(search, function gotAsset(error, results) {
    if(results.length > 0) {
      logger.log('debug', fileMetadata.filename + ': similar file found in DB, not importing');
      idMap[fileMetadata.oldId] = results[0]._id;
      return assetImported();
    }

    var date = new Date();
    var hash = crypto.createHash('sha1');
    var rs = fs.createReadStream(fileMetadata.path);

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
        createThumbnail: true,
        thumbnailOptions: {
          width: '?',
          height: '200'
        }
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
          app.assetmanager.createAsset(asset, function onAssetCreated(createError, assetRec) {
            if (createError) {
              logger.log('error', createError)
              storage.deleteFile(storedFile.path, assetImported);
              return;
            }
            // TODO - add flag so we can clean up if fail.
            idMap[fileMetadata.oldId] = assetRec._id;
            assetImported();
          });
        });
      });
    });
  });
};

/**
 * Module exports
 *
 */

exports = module.exports = ImportSource;
