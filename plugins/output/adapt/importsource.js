// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
const _ = require('underscore');
const async = require('async');
const configuration = require('../../../lib/configuration');
const Constants = require('../../../lib/outputmanager').Constants;
const database = require("../../../lib/database");
const filestorage = require('../../../lib/filestorage');
const fs = require("fs-extra");
const glob = require('glob');
const helpers = require('./helpers');
const logger = require("../../../lib/logger");
const mime = require('mime');
const path = require("path");

function ImportSource(req, done) {
  var dbInstance;

  var contentMap = {
    course: 'course',
    config: 'config',
    contentobject: 'contentObjects',
    article: 'articles',
    block: 'blocks',
    component: 'components'
  };
  var cachedJson = {};
  var plugindata = {
    pluginTypes: [
      { type: 'component', folder: 'components' },
      { type: 'extension', folder: 'extensions', attribute: '_extensions' },
      { type: 'menu',      folder: 'menu',       attribute: 'menuSettings' },
      { type: 'theme',     folder: 'theme',      attribute: 'themeSettings' }
    ],
    pluginIncludes: [],
    theme: [],
    menu: []
  };
  var metadata = {
    idMap: {},
    assetNameMap: {}
  };
  var detachedElementsMap = Object.create(null);
  var pluginLocations = {};
  var enabledExtensions = {};
  var userId = app.usermanager.getCurrentUser()._id;
  var tenantId = app.usermanager.getCurrentUser().tenant._id;
  var unzipFolder = tenantId + '_' + userId + '_unzipped';
  var COURSE_ROOT_FOLDER = path.join(configuration.tempDir, configuration.getConfig('masterTenantID'), Constants.Folders.Framework, Constants.Folders.AllCourses, tenantId, unzipFolder);
  var COURSE_JSON_PATH = path.join(COURSE_ROOT_FOLDER, Constants.Folders.Source, Constants.Folders.Course);
  var IMPORT_INFO_FILE = 'importInfo.json';
  var origCourseId;
  var courseId;
  var PATH_REXEX = new RegExp(/(course\/)((\w)*\/)*(\w)*.[a-zA-Z0-9]+/gi);

  // Values retrieved from importInfo.json
  var COURSE_LANG;
  var formTags;
  var assetFolders = [];
  var details = {};
  var cleanupDirs = [];

  /**
  * Main process
  * All functions delegated below for readability
  */
  async.series([
    retrieveImportInfo,
    prepare,
    installPlugins,
    addAssets,
    cacheMetadata,
    importContent
  ], (importErr, result) => { // cleanup should run regardless of import success
    helpers.cleanUpImport(cleanupDirs, cleanUpErr => done(importErr || cleanUpErr));
  });

  function retrieveImportInfo(cb) {
    fs.readJson(path.join(COURSE_ROOT_FOLDER, IMPORT_INFO_FILE), function(error, obj) {
      if(error) return cb(error);
      COURSE_LANG = obj.COURSE_LANG;
      formTags = obj.formTags;
      assetFolders = obj.assetFolders;
      plugindata.pluginIncludes = obj.pluginIncludes;
      details = obj.details;
      cleanupDirs = obj.cleanupDirs;
      cb();
    });
  }

  function prepare(cb) {
    async.parallel([
      function(cb2) {
        database.getDatabase(function(error, db) {
          if(error) return cb2(error);
            dbInstance = db;
            cb2();
        });
      },
      function(cb2) {
        async.eachSeries(Object.keys(contentMap), function(type, cb3) {
          var jsonPath = path.join(COURSE_JSON_PATH, (type !== 'config') ? COURSE_LANG : '', `${contentMap[type] || type}.json`);
          fs.readJson(jsonPath, function(error, jsonData) {
            if(error) {
              logger.log('error', error)
              return cb2(error);
            } // NOTE also save the json for later, no need to load it twice
            cachedJson[type] = jsonData;
            cb3();
          });
        }, cb2);
      }
    ], cb);
  }

  /**
  * Installs any custom plugins
  */
  function installPlugins(done) {
    async.each(plugindata.pluginIncludes, function(pluginData, donePluginIterator) {
      // Ignore white & amber, nothing to install
      if (pluginData.name in details.pluginVersions.white ||
          pluginData.name in details.pluginVersions.amber) {
        return donePluginIterator();
      }

      // Red shouldn't make it this far - throw error
      if (pluginData.name in details.pluginVersions.red) {
        return donePluginIterator('Incompatible plugin ' + pluginData.name);
      }

      // Green plugins need to be installed (either fresh install or update)
      helpers.importPlugin(pluginData.location, pluginData.type, donePluginIterator);
    }, done);
  }

  /**
  * Imports assets to the library. If the course to be imported contains an assets.json file
  * (it was exported from the authoring tool) then use metadata from this file to populate the
  * title, description and tag fields, these will be used to create a new asset if an asset
  * with matching filename is not found in the database.
  */
  function addAssets(done) {
    async.eachSeries(assetFolders, function iterator(assetDir, doneAssetFolder) {
      var assetDirPath = path.join(COURSE_JSON_PATH, COURSE_LANG, assetDir);

      if (!fs.existsSync(assetDirPath)) {
        logger.log('error', 'Framework import error. Cannot find folder: ' + assetDirPath);
        return doneAssetFolder();
      }
      var assetsGlob = path.join(COURSE_JSON_PATH, COURSE_LANG, assetDir, '*');
      var assetsJsonFilename = path.join(COURSE_JSON_PATH, COURSE_LANG, Constants.Filenames.Assets);
      var assetsJson = {};

      if (fs.existsSync(assetsJsonFilename)) {
        assetsJson = fs.readJSONSync(assetsJsonFilename);
      }
      glob(assetsGlob, function (error, assets) {
        if(error) {
          return doneAssetFolder(error);
        }
        var repository = configuration.getConfig('filestorage') || 'localfs';
        async.eachSeries(assets, function iterator(assetPath, doneAsset) {
          if (error) {
            return doneAsset(error);
          }
          var assetName = path.basename(assetPath);
          var assetExt = path.extname(assetPath);
          var assetId = path.basename(assetPath);
          var fileStat = fs.statSync(assetPath);
          var assetTitle = assetName;
          var assetDescription = assetName;
          var assetJson = assetsJson[assetName];
          var tags = [];

          var fileMeta = {
            oldId: assetId,
            title: assetTitle,
            type: mime.getType(assetName),
            size: fileStat["size"],
            filename: assetName,
            description: assetDescription,
            path: assetPath,
            tags: tags,
            repository: repository,
            createdBy: app.usermanager.getCurrentUser()._id
          };

          if (!assetJson) return helpers.importAsset(fileMeta, metadata, doneAsset);

          addAssetTags(assetJson, function(error, assetTags) {
            const warn = (error) => logger.log('warn', `Failed to create asset tag ${error}`);
            if (error) return warn(new Error(error));
            fileMeta.title = assetJson.title;
            fileMeta.description = assetJson.description;
            fileMeta.tags = assetTags;
            helpers.importAsset(fileMeta, metadata, doneAsset);
          });
        }, doneAssetFolder);
      });
    }, done);
  }

  function addAssetTags(assetJson, cb) {
    var assetTags = [];
    assetJson.tags.forEach(function(tag) {
      var tagTitle = tag.title;
      if(!tagTitle) return cb('Tag has no title');
      app.contentmanager.getContentPlugin('tag', function(error, plugin) {
        if(error) return cb(tagTitle.concat(' ', error));
        plugin.create({ title: tagTitle }, function(error, record) { // @note retrieves if tag already exists
          if(error) return cb(tagTitle.concat(' ', error));
          assetTags.push(record._id);
        });
      });
    });
    cb(null, assetTags);
  }

  /**
  * Stores plugin metadata for use later
  */
  function cacheMetadata(done) {
    async.each(plugindata.pluginTypes, storePlugintype, done);
  }

  function storePlugintype(pluginTypeData, cb) {
    const type = pluginTypeData.type;
    dbInstance.retrieve(`${type}type`, {}, { jsonOnly: true }, function(error, results) {
      if(error) {
        return cb(error);
      }
      async.each(results, function(plugin, cb2) {
        const properties = plugin.properties;
        const locations = properties && properties.pluginLocations;
        if(!metadata[`${type}Map`]) {
          metadata[`${type}Map`] = {};
        }
        metadata[`${type}Map`][plugin[type]] = {
          targetAttribute: plugin.targetAttribute,
          version: plugin.version,
          name: plugin.name,
          _id: plugin._id
        };
        if(locations) {
          if(!pluginLocations[type]) {
            pluginLocations[type] = {};
          }
          pluginLocations[type][plugin.targetAttribute] = locations;
        }
        cb2();
      }, cb);
    });
  }

  /**
  * Creates the course content
  */
  function importContent(done) {
    async.series([
      function enableExtensions(cb) {
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
              // add the theme name to config JSON
              fs.readJson(path.join(pluginData.location, Constants.Filenames.Bower), function(error, themeJson) {
                if(error) return doneItemIterator(error);
                plugindata.theme.push({ _theme: themeJson.name});
                doneItemIterator();
              });
              break;
            case 'menu':
              // add the menu name to config JSON
              fs.readJson(path.join(pluginData.location, Constants.Filenames.Bower), function(error, menuJson) {
                if(error) return doneItemIterator(error);
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
      function createContent(cb) {
        async.eachSeries(Object.keys(contentMap), function(type, cb2) {
          var contentJson = cachedJson[type];
          switch(type) {
            case 'course': {
              createContentItem(type, contentJson, function(error, courseRec) {
                if(error) return cb2(error);
                origCourseId = contentJson._id;
                courseId = metadata.idMap[origCourseId] = courseRec._id;
                cb2();
              });
              return;
            }
            case 'config': {
              createContentItem(type, contentJson, cb2);
              return;
            }
            case 'contentobject': { // Sorts in-place the content objects to make sure processing can happen
              var byParent = _.groupBy(contentJson, '_parentId');
              Object.keys(byParent).forEach(id => {
                byParent[id].forEach((item, index) => item._sortOrder = index + 1);
              });
              var groups = _.groupBy(contentJson, '_type');
              var sortedSections = helpers.sortContentObjects(groups.menu, origCourseId, []);
              contentJson = sortedSections.concat(groups.page);
            }
          }
          // assume we're using arrays
          async.eachSeries(contentJson, function(item, cb3) {
            createContentItem(type, item, function(error, contentRec) {
              if(error) {
                return cb3(error);
              }
              if(!contentRec || !contentRec._id) {
                logger.log('warn', 'Failed to create map for '+ item._id);
                return cb3();
              }
              metadata.idMap[item._id] = contentRec._id;
              cb3();
            });
          }, cb2);
        }, cb);
      },
      function checkDetachedContent(cb) {
        const detachedIds = Object.keys(detachedElementsMap);
        if (detachedIds.length === 0) return cb();

        const groups = detachedIds.reduce(function(result, id) {
          if (result[detachedElementsMap[id]] === undefined) {
            result[detachedElementsMap[id]] = [];
          }
          result[detachedElementsMap[id]].push(id);
          return result;
        }, Object.create(null));
        const errorMsg = Object.keys(groups).reduce(function(errorString, group) {
          errorString.push(`${group}'s: ${ groups[group].join(',') }`);
          return errorString;
        }, [app.polyglot.t('app.importcoursepartialintro')]);
        errorMsg.push(app.polyglot.t('app.importcoursecheckcourse'));
        cb(new helpers.PartialImportError(errorMsg.join('\n')));
      }
    ], done);
  }

  function transformContent(type, originalData) {
    return new Promise(async (resolve, reject) => {
      var data = _.extend({}, originalData);
      /**
      * Basic prep of data
      */
      delete data._id;
      delete data._trackingId;
      delete data._latestTrackingId;
      data.createdBy = app.usermanager.getCurrentUser()._id;
      if(type !== 'course') {
        data._courseId = courseId;
      }
      if(data._component) {
        data._componentType = metadata.componentMap[data._component]._id;
      }
      if(data._parentId) {
        if(metadata.idMap[data._parentId]) {
          data._parentId = metadata.idMap[data._parentId];
        } else {
          detachedElementsMap[originalData._id] = type;
          logger.log('warn', 'Cannot update ' + originalData._id + '._parentId, ' +  originalData._parentId + ' not found in idMap');
          return resolve();
        }
      }
      /**
      * Content-specific attributes
      */
      if(type === 'course') {
        data = _.extend(data, { tags: formTags });
        try {
          var contents = await fs.readFile(path.join(COURSE_ROOT_FOLDER, Constants.Folders.Source, Constants.Folders.Theme, plugindata.theme[0]._theme, 'less', Constants.Filenames.CustomStyle), 'utf8');
          data = _.extend(data, { customStyle: contents.toString() });
        } catch(e) {
          if (e.code !== 'ENOENT') {
            return reject(e);
          }
        }
      }
      else if(type === 'config') {
        data = _.extend(data, enabledExtensions, plugindata.theme[0], plugindata.menu[0], { "_defaultLanguage" : COURSE_LANG });
      }
      /**
      * Define the custom properties and and pluginLocations
      */
      var genericPropKeys = Object.keys(dbInstance.getModel(type).schema.paths);
      var customProps = _.pick(data, _.difference(Object.keys(data), genericPropKeys));

      if(_.isEmpty(customProps)) return resolve(data);

      plugindata.pluginTypes.forEach(function(typeData) {
        if(!pluginLocations[typeData.type]) return;

        var pluginKeys = _.intersection(Object.keys(customProps), Object.keys(pluginLocations[typeData.type]));

        if(pluginKeys.length === 0) return;

        data[typeData.attribute] = _.pick(customProps, pluginKeys);
        data = _.omit(data, pluginKeys);
        customProps = _.omit(customProps, pluginKeys);
      });
      // everything else is a customer property
      data.properties = customProps;
      data = _.omit(data, Object.keys(customProps));

      resolve(data);
    });
  }

  function createContentItem(type, originalData, done) {
    var data;
    // organise functions in series, mainly for readability
    async.series([
      function transform(cb) {
        transformContent(type, originalData).then(transformedData => {
          data = transformedData;
          cb();
        }).catch(cb);
      },
      function updateAssetData(cb) {
        var newAssetPath = Constants.Folders.Course + '/' + Constants.Folders.Assets; // always use '/' for paths in content
        var traverse = require('traverse');

        traverse(data).forEach(function (value) {
          if (!_.isString(value)) return;
          var isPath = value.match(PATH_REXEX);

          if (!isPath) return;
          var dirName = path.dirname(value);
          var newDirName;

          for (index = 0; index < assetFolders.length; ++index) {
            var folderMatch = "(course\/)((\\w){2}\/)" + '(' + assetFolders[index] + ')';
            var assetFolderRegex = new RegExp(folderMatch, "gi");

            if (!dirName.match(assetFolderRegex)) continue;
            newDirName = dirName.replace(assetFolderRegex, newAssetPath);
          }

          var fileExt = path.extname(value);
          var fileName = path.basename(value);
          if (newDirName && fileName && fileExt) {
            try {
              var fileId = metadata.idMap[fileName];
              var newFileName = metadata.assetNameMap[fileId];
              if (newFileName) {
                this.update(newDirName + '/' + newFileName); // always use '/' for paths in content
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
      if (detachedElementsMap[originalData._id]) { // do not import detached elements
        return done();
      } // now we're ready to create the content
      app.contentmanager.getContentPlugin(type, function(error, plugin) {
        if(error) return done(error);
        plugin.create(data, function(error, record) {
          if(error) {
            logger.log('warn', 'Failed to import ' + type + ' ' + (originalData._id || '') + ' ' + error);
            return done();
          } // Create a courseAssets record if needed
          createCourseAssets(type, record, error => done(error, record));
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
    var assetData = {
      _courseId : contentData._courseId,
      _contentType: type,
      _contentTypeParentId: contentData._parentId
    };
    // some courseassets values change depending on what content type they're for
    switch(type) {
      case 'course':
        assetData._courseId = assetData._contentTypeId = assetData._contentTypeParentId = contentData._id;
        break;
      case 'article', 'block', 'config':
        assetData._contentTypeId = contentData._componentType;
        break;
      default:
        assetData._contentTypeId = contentData._id;
        break;
    }
    var contentDataString = JSON.stringify(contentData);
    var assetArray = contentDataString.match(PATH_REXEX);
    // search through object values for file paths
    async.each(assetArray, function(data, callback) {
      delete assetData._assetId;
      if (!_.isString(data)) {
        return callback();
      }
      var assetBaseName = path.basename(data);
      // get asset _id from lookup of the key of metadata.assetNameMap mapped to assetBaseName
      var matchingAssetId = _.findKey(metadata.assetNameMap, value => value === assetBaseName);

      if (!matchingAssetId) return callback();

      app.assetmanager.retrieveAsset({ _id: matchingAssetId }, function gotAsset(error, results) {
        if (error) {
          logger.log('error', error);
          return callback(error);
        }
        Object.assign(assetData, {
          _assetId: matchingAssetId,
          createdBy: app.usermanager.getCurrentUser(),
          _fieldName: results.length > 0 ? _.pluck(results, 'filename')[0] : assetBaseName
        });
        app.contentmanager.getContentPlugin('courseasset', function(error, plugin) {
          if(error) {
            return callback(error);
          }
          plugin.create(assetData, function(error, assetRecord) {
            if(error) logger.log('warn', `Failed to create courseasset ${type} ${assetRecord || ''} ${error}`);
            callback(error);
          });
        });
      });
    }, cb);
  }
}

/**
 * Module exports
 *
 */

exports = module.exports = ImportSource;
