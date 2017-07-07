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
// TODO add assets to clean up routine if import fails

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
    pluginIncludes: [],
    theme: [],
    menu: []
  };
  var metadata = {
    idMap: {},
    componentMap: {},
    extensionMap: {},
    assetNameMap: {}
  };
  var extensionLocations = {};
  var enabledExtensions = {};
  var tenantId = app.usermanager.getCurrentUser().tenant._id;
  var unzipFolder = tenantId + '_unzipped';
  var COURSE_ROOT_FOLDER = path.join(configuration.tempDir, configuration.getConfig('masterTenantID'), Constants.Folders.Framework, Constants.Folders.AllCourses, tenantId, unzipFolder);
  // TODO - This should not be hard coded, needs to deal with other lang folders
  var COURSE_LANG;
  var COURSE_JSON_PATH = path.join(COURSE_ROOT_FOLDER, Constants.Folders.Source, Constants.Folders.Course);
  var courseRoot = path.join(COURSE_ROOT_FOLDER, Constants.Folders.Source, Constants.Folders.Course);

  var form = new IncomingForm();
  var origCourseId;
  var courseId;
  var configId;
  var cleanupDirs = [];
  var assetFields = [];
  var PATH_REXEX = new RegExp(/(course\/)((\w)*\/)*(\w)*.[a-zA-Z0-9]+/, 'gi');

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
      function findLanguages(cb) {
        // socket import setup
        var courseLangs = [];
        fs.readdir(COURSE_JSON_PATH, function (error, files) {
            if (error) {
              return cb(error);
            }
            files.map(function (file) {
              return path.join(COURSE_JSON_PATH, file);
            }).filter(function (file) {
              return fs.statSync(file).isDirectory();
            }).forEach(function (file) {
              courseLangs.push(path.basename(file));
            });
            COURSE_LANG = courseLangs[0] ? courseLangs[0] : 'en';
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
          fs.readJson(path.join(COURSE_JSON_PATH, COURSE_LANG, contentMap[type] + '.json'), function(error, contentJson) {
            if(error) {
              logger.log('error', error)
              return cb2(error);
            }
            cb2();
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
    var assetsGlob = path.join(COURSE_JSON_PATH, COURSE_LANG, Constants.Folders.Assets, '*');
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
        helpers.importAsset(fileMeta, metadata, doneAsset);
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

          var srcDir = path.join(COURSE_ROOT_FOLDER, Constants.Folders.Source, pluginType.folder);
          fs.readdir(srcDir, function (err, files) {
              if (err) {
                return done(err);
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
              doneMapIterator();
          });
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
              metadata.componentMap[component.component] = component._id;
              cb2();
            }, cb);
          });
        },
        function storeExtensiontypes(cb) {
          db.retrieve('extensiontype', {}, { jsonOnly: true }, function(error, results) {
            if(error) return cb(error);
            async.each(results, function(extension, cb2) {
              metadata.extensionMap[extension.extension] = {
                "targetAttribute": extension.targetAttribute,
                "version": extension.version,
                "name": extension.name,
                "_id": extension._id
              };

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
        fs.readJson(path.join(COURSE_JSON_PATH, COURSE_LANG, 'course.json'), function(error, courseJson) {
          if(error) return cb(error);
          courseJson = _.extend(courseJson, { tags: formTags });
          createContentItem('course', courseJson, '', function(error, courseRec) {
            if(error) return cb(error);
            origCourseId = courseJson._id;
            courseId = metadata.idMap[origCourseId] = courseRec._id;
            cb();
          });
        });
      },
      function enableExtensions(cb) {
        // TODO this function should be surfaced properly somewhere
        var includeExtensions = {};
        async.eachSeries(plugindata.pluginIncludes, function(pluginData, doneItemIterator) {
          switch(pluginData.type) {
            case 'extension':
              fs.readJson(path.join(pluginData.location, Constants.Filenames.Bower), function(error, extensionJson) {
                if(error) return cb(error);
                includeExtensions[extensionJson.extension] = metadata.extensionMap[extensionJson.extension];
                doneItemIterator();
              });
              break;
            case 'theme':
              // add the theme value to config JSON
              fs.readJson(path.join(pluginData.location, Constants.Filenames.Bower), function(error, themeJson) {
                if(error) return cb(error);
                plugindata.theme.push({ _theme: themeJson.name});
                doneItemIterator();
              });
              break;
            case 'menu':
              // add the theme value to config JSON
              fs.readJson(path.join(pluginData.location, Constants.Filenames.Bower), function(error, menuJson) {
                if(error) return cb(error);
                plugindata.menu.push({ _menu: menuJson.name});
                doneItemIterator();
              });
              break;
            default:
              doneItemIterator();
              break;
          }
        }, function(error) {
          if(error) return cb(error);

          enabledExtensions = {
            "_enabledExtensions": includeExtensions
          };
          cb();
        });
      },
      function createConfig(cb) {
        fs.readJson(path.join(COURSE_JSON_PATH, 'config.json'), function(error, configJson) {
          if(error) return cb(error);
          // at the moment AT can only deal with one theme or menu
          var updatedConfigJson = _.extend(configJson, enabledExtensions, plugindata.theme[0], plugindata.menu[0], { "_defaultLanguage" : COURSE_LANG });
          createContentItem('config', updatedConfigJson, courseId, function(error, configRec) {
            if(error) return cb(error);
            configId = configRec._id;
            cb();
          });
        });
      },
      function createContent(cb) {
        async.eachSeries(Object.keys(contentMap), function(type, cb2) {
          app.contentmanager.getContentPlugin(type, function(error, plugin) {
            if(error) return cb2(error);
            fs.readJson(path.join(COURSE_JSON_PATH, COURSE_LANG, contentMap[type] + '.json'), function(error, contentJson) {
              if(error) return cb2(error);

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
                  if (contentRec && contentRec._id) {
                    metadata.idMap[item._id] = contentRec._id;
                  } else {
                    logger.log('error', 'Failed to create map for '+ item._id);
                  }
                  cb3();
                });
              }, cb2);
            });
          });
        }, cb);
      }
    ], done);
  }

  function createContentItem(type, originalData, courseId, done) {
    // data needs to be transformed a bit first
    var data = _.extend({}, originalData);

    // organise functions in series, mainly for readability
    async.series([
        function prepareData(cb) {
          // basic prep of data
          delete data._id;
          delete data._trackingId;
          delete data._latestTrackingId;
          data.createdBy = app.usermanager.getCurrentUser()._id;
          if(!_.isEmpty(courseId)) data._courseId = courseId;
          if(data._component) {
            data._componentType = metadata.componentMap[data._component];
          }
          if(data._parentId) {
            if(metadata.idMap[data._parentId]) {
              data._parentId = metadata.idMap[data._parentId];
            } else {
              logger.log('warn', 'Cannot update ' + originalData._id + '._parentId, ' +  originalData._parentId + ' not found in idMap');
            }
          }

          // define the custom properties and _extensions
          database.getDatabase(function(error, db) {
            if(error) return cb(error);
            var genericPropKeys = Object.keys(db.getModel(type).schema.paths);
            var customProps = _.pick(data, _.difference(Object.keys(data), genericPropKeys));
            var extensions = _.pick(customProps, _.intersection(Object.keys(customProps),Object.keys(extensionLocations)));
            customProps = _.omit(customProps, Object.keys(extensions));
            data.properties = customProps
            data._extensions = extensions;
            data = _.omit(data, Object.keys(customProps));
            cb();
          });
        },
        function updateAssetData(cb) {
          // TODO -- Strip lang folder. This global replace is intended as a temporary solution
          var replaceRegex = new RegExp(/(course\/)((\w){2}\/)/, 'gi');
          var newAssetPath = Constants.Folders.Course + path.sep;

          var traverse = require('traverse');
          // TODO - remove traverse and replace with string replace similar to https://github.com/adaptlearning/adapt_authoring/blob/master/lib/outputmanager.js#L764
          traverse(data).forEach(function (value) {
            if (!_.isString(value)) return;
            var isPath = value.match(PATH_REXEX);

            if (!isPath) return;
            var dirName = path.dirname(value);
            var newDirName = dirName.replace(replaceRegex, newAssetPath);
            var fileExt = path.extname(value);
            var fileName = path.basename(value, fileExt);

            if (dirName && fileName && fileExt) {
              try {
                var fileId = metadata.idMap[fileName];
                var newFileName = metadata.assetNameMap[fileId];
                if (newFileName) {
                  this.update(path.join(newDirName, newFileName));
                }
              } catch (e) {
                logger.log('error', e);
                return;
              }
            }
          });
          cb();
        }
    ], function(error, results) {
      if(error) return done(error);

      // now we're ready to create the content
      app.contentmanager.getContentPlugin(type, function(error, plugin) {
        if(error) return done(error);
        plugin.create(data, function(error, record) {
          if(error) {
            logger.log('warn', 'Failed to import ' + type + ' ' + (originalData._id || '') + ' ' + error);
            return done(); // TODO collect failures, maybe try again
          }
          // Create a courseAssets record if needed
          createCourseAssets(type, record, function(error){
            if(error) return done(error, record);
            done(null, record);
          });
        });
      });
    });
  }

  /**
  * Adds courseasset record
  * to the contentTypeId, courseId and userId.
  * @param {type} type
  * @param {object} contentData
  * @param {callback} cb
  */
  function createCourseAssets(type, contentData, cb) {
    var courseAssetsArray;
    var assetData = {};
    var componentPlugin;
    var extensionPlugins;
    // courseassets values change depending on what content type they are for
    switch(type) {
      case 'course':
        assetData = {
            _courseId : contentData._id,
            _contentType : type,
            _contentTypeId : contentData._id,
            _contentTypeParentId: contentData._id
        };
        break;
      case 'article', 'block', 'config':
        assetData = {
            _courseId : contentData._courseId,
            _contentType : type,
            _contentTypeId : contentData._componentType,
            _contentTypeParentId: contentData._parentId
        };
        break;
      default:
        assetData = {
            _courseId : contentData._courseId,
            _contentType : type,
            _contentTypeId : contentData._id,
            _contentTypeParentId: contentData._parentId
        };
        break;
    }

    var contentDataString = JSON.stringify(contentData);
    var assetArray = contentDataString.match(PATH_REXEX);

    // search through object values for file paths
    async.each(assetArray, function(data, callback) {
      delete assetData._assetId;
      if (!_.isString(data)) return callback();

      var assetBaseName = path.basename(data);
      // get asset _id from lookup of the key of metadata.assetNameMap mapped to assetBaseName
      _.findKey(metadata.assetNameMap, function(value, key) {
        if (value === assetBaseName) {
          var assetId = key;
          var search = {
            _id: assetId
          };
          app.assetmanager.retrieveAsset(search, function gotAsset(error, results) {
            if (error) {
              logger.log('error', error);
            }

            assetData._assetId = assetId;
            assetData.createdBy = app.usermanager.getCurrentUser();

            if (results.length > 0) {
              assetData._fieldName = _.pluck(results, 'filename');
            } else {
              assetData._fieldName = assetBaseName;
            }
            app.contentmanager.getContentPlugin('courseasset', function(error, plugin) {
              if(error) return cb(error);
              plugin.create(assetData, function(error, assetRecord) {
                if(error) {
                  logger.log('warn', 'Failed to create courseasset ' + type + ' ' + (assetRecord || '') + ' ' + error);
                  //TODO collect failures, maybe try again
                }
              });
            });
          });
        }
      });
    }, cb(null, contentData));
  }
}

/**
 * Module exports
 *
 */

exports = module.exports = ImportSource;
