// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
/**
 * Ouput plugin submodule
 */

var path = require('path'),
    _ = require('underscore'),
    fs = require('fs-extra'),
    util = require('util'),
    async = require('async'),
    EventEmitter = require('events').EventEmitter,
    configuration = require('./configuration'),
    assetmanager = require('./assetmanager'),
    filestorage = require('./filestorage'),
    logger = require('./logger'),
    rest = require('./rest'),
    pluginmanager = require('./pluginmanager'),
    database = require('./database'),
    usermanager = require('./usermanager'),
    origin = require('../');

/*
 * CONSTANTS
 */
var MODNAME = 'outputmanager',
    WAITFOR = 'pluginmanager';


var Constants = {
    CourseCollections : {
        'course': {
            tag: null,
            filename: 'course.json',
            omitProps: ['themeSettings', 'customStyle']
        },
        'config': {
            tag: null,
            filename: 'config.json',
            omitProps: ['_theme', '_menu',
              '_enabledExtensions', '_enabledComponents',
            ]
        },
        'contentobject': {
            tag: 'co',
            filename: 'contentObjects.json',
            omitProps: null
        },
        'article': {
            tag: 'a',
            filename: 'articles.json',
            omitProps: null
        },
        'block': {
            tag: 'b',
            filename: 'blocks.json',
            omitProps: null
        },
        'component' : {
            tag: 'c',
            filename: 'components.json',
            omitProps: null
        }
    },
    Folders: {
        Source: 'src',
        Build: 'build',
        Assets: 'assets',
        ImportAssets: ['assets', 'images', 'video', 'audio'],
        Exports: 'exports',
        Course: 'course',
        AllCourses: 'courses',
        Theme: 'theme',
        Temp: 'temp',
        Menu: 'menu',
        Extensions: 'extensions',
        Components: 'components',
        Less: 'less',
        Framework: 'adapt_framework',
        Plugins: 'plugins',
        CustomStyleDirectory: 'zzzzz'
    },
    Filenames: {
      Download: 'download.zip',
      Main: 'index.html',
      Rebuild: '.rebuild',
      CustomStyle: '2-customStyles.less',
      Bower: 'bower.json',
      Package: 'package.json',
      Metadata: 'metadata.json',
      Variables: '1-themeVariables.less',
      Assets: 'assets.json'
    },
    Modes: {
      Export: 'EXPORT',
      Preview: 'PREVIEW',
      Publish: 'PUBLISH'
    }
};

/**
 * base constructor for Output plugins
 * @api public
 */
function OutputPlugin () {

}

OutputPlugin.prototype.getCourseJSON = function(tenantId, courseId, next) {
  logger.log('info', 'Retrieving JSON');
  database.getDatabase(function(err, db) {
    if (err) {
      logger.log('error', err);
      return next(err);
    }
    // create a single JSON object to store all Constant.CourseCollections
    async.reduce(Object.keys(Constants.CourseCollections), {}, function(memo, collectionType, callback) {
      // hijack this to call storeOutput
      callback = async.apply(storeOutput, memo, callback);
      if (collectionType === 'config') {
        return getConfigJson(courseId, callback);
      }
      getContentJson(collectionType, courseId, db, callback);
    }, next);
  }, tenantId);
};

// delegate function to memoise return values from getConfigJson and getContentJson
function storeOutput(outputJson, callback, error, data) {
  if(error) {
    return callback(error);
  }
  callback(null, Object.assign(outputJson, data));
}

function getConfigJson(courseId, callback) {
  origin().contentmanager.getContentPlugin('config', function (err, contentPlugin) {
    if (err) {
      return callback(err);
    }
    contentPlugin.retrieve({ _courseId: courseId }, {}, function(err, config) {
      if (err) {
        return callback(err);
      }
      if (config.length !== 1) {
        return callback(new Error('Preview/Publish: Unable to retrieve config.json'));
      }

      // Retrieve the component types.
      database.getDatabase(function(err, db) {
        if (err) {
          logger.log('error', err);
          return next(err);
        }

        db.retrieve('component', {_courseId: courseId}, {operators: {distinct: '_component'}}, function (err, components) {
          db.retrieve('componenttype', {}, function(err, componentTypes) {
            if (err) {
              return next(err);
            }

            async.map(components, function(component, callback) {
              var componentType = _.findWhere(componentTypes, {component: component});
              return callback(null, { name: componentType.name });
            }, function(err, uniqueComponentList) {
              var configModel = config[0];
              configModel._enabledComponents = uniqueComponentList;

              callback(null, { config: [flattenNestedObjects(configModel)] });
            });
          });
        });
      }, configuration.getConfig('dbName'));
    });
  });
}

function getContentJson(contentType, courseId, db, callback) {
  var criteria = { _courseId: courseId };
  if(contentType === 'course') {
    criteria = { _id: courseId };
  }
  var options = { operators: { sort: { _sortOrder: 1 } }  };
  db.retrieve(contentType, criteria, options, function (error, results) {
    if (error) {
      return callback(error);
    }
    if(!results || !results.length) {
      return callback(null, {});
    }
    db.exportResults(results, function (transformed) {
      var output = [];
      transformed && transformed.forEach(function(item) {
        output.push(flattenNestedObjects(item));
      });
      callback(null, { [contentType]: output });
    });
  });
}

function flattenNestedObjects(targetItem) {
  ['_extensions', 'menuSettings', 'themeSettings'].forEach(function(attribute) {
    if (!targetItem[attribute]) {
      return;
    }
    // move all nested attributes to the targetItem, but don't overwrite anything
    Object.keys(targetItem[attribute]).forEach(function(key) {
      if(!targetItem[key]) targetItem[key] = targetItem[attribute][key];
    });
    // delete the nested object
    delete targetItem[attribute];
  });
  return targetItem;
}

/**
 * Sanatizes the component
 * @param mode string A string describing the type of output (eg export, publish, preview)
 * @param json Course json
 * @param next callback
 */
OutputPlugin.prototype.sanitizeCourseJSON = function(mode, json, next) {
  var self = this;

  try {
    var outputJson = json;

    var courseJson = outputJson['course'][0];
    var configJson = outputJson['config'][0];
    var contentObjectJson = outputJson['contentobject'];
    var blockJson = outputJson['block'];
    var componentJson = outputJson['component'];
    var courseId = courseJson._id;
    // The Adapt Framework expects the 'type' and '_id'
    // attributes of the course to be set to 'course'
    courseJson._type = 'course';
    courseJson._id = 'course';
    courseJson._latestTrackingId = blockJson.length;
    // Replace any reference to the original course _id value in contentObjects JSON
    for (var i = 0; i < contentObjectJson.length; i++) {
      if (contentObjectJson[i]._parentId.toString() == courseId) {
        contentObjectJson[i]._parentId = 'course';
      }
    }
    // Add a _trackingId value to every block
    for (var i = 0; i < blockJson.length; i++) {
      blockJson[i]._trackingId = (i + 1);
    }
    // The 'properties' property of a component should not be included as an
    // attribute in the output, but all its children should
    for (var i = 0; i < componentJson.length; i++) {
      if (componentJson[i].hasOwnProperty('properties')) {
        for(var key in componentJson[i].properties){
          if (componentJson[i].properties.hasOwnProperty(key)){
             componentJson[i][key] = componentJson[i].properties[key];
          }
        }
        // Remove the 'properties' property
        delete componentJson[i].properties;
      }
    }

    // _themePreset should only be included in preview
    if (mode !== Constants.Modes.Preview) {
      delete configJson._themePreset;
    }

    async.waterfall([
      function(callback) {
        self.generateIncludesForConfig(configJson, function(error, includes) {
          if (error) {
            return callback(error);
          }
          configJson.build = { includes: includes };
          callback();
        });
      }
    ], function(error) {
      if (error) {
        logger.log(error);
        return next(error);
      }
      // Store the sanitized JSON
      Object.assign(outputJson, {
        course: courseJson,
        config: configJson,
        contentobject: contentObjectJson,
        component: componentJson
      });

      next(null, outputJson);

    });
  } catch(err) {
    return next(err);
  }
};

OutputPlugin.prototype.generateIncludesForCourse = function(courseId, next) {
  async.waterfall([
    (callback) => {
      getConfigJson(courseId, callback);
    },
    (json, callback) => {
      this.generateIncludesForConfig(json.config[0], (error, includes) => {
        if(error) {
          return callback(error);
        }
        if(!includes) {
          return callback(new Error(`No plugins included in course ${courseId}`));
        }
        callback(null, includes);
      });
    }
  ], next);
};

// Process the 'config' object to hold the plugins
OutputPlugin.prototype.generateIncludesForConfig = function(config, callback) {
  var self = this;
  var pluginNames = [];
  var source_root = path.join(configuration.tempDir, configuration.getConfig('masterTenantID'), Constants.Folders.Framework, Constants.Folders.Source);
  var includedPlugins = generateIncludedPlugins(config);

  async.eachSeries(includedPlugins, function(plugin, next) {
    if (plugin.length < 2) {
      logger.log('Included plugins incorrectly specified.');
      return next('Included plugins incorrectly specified.');
    }
    self.addPluginWithDependencies(pluginNames, source_root, plugin[0], plugin[1], next);

  }, function(error) {
    if (error) {
      logger.log('error', error);
      return callback(error);
    }
    /**
     * Temporary HACK
     * See https://github.com/adaptlearning/adapt_authoring/pull/1896
     */
    if (_.indexOf(pluginNames, 'adapt-contrib-gmcq') > -1 && _.indexOf(pluginNames, 'adapt-contrib-mcq') === -1) {
      pluginNames.push('adapt-contrib-mcq');
    }
    return callback(null, pluginNames);
  });
};

function generateIncludedPlugins(config) {
  const includedPlugins = [];
  const pluginTypeInfos = [
    { folder: Constants.Folders.Menu, attribute: '_menu' },
    { folder: Constants.Folders.Theme, attribute: '_theme' },
    { folder: Constants.Folders.Components, attribute: '_enabledComponents' },
    { folder: Constants.Folders.Extensions, attribute: '_enabledExtensions' }
  ].forEach(pluginTypeInfo => {
    const val = config[pluginTypeInfo.attribute];
    if(val === undefined) return;
    // string, store and return
    if(typeof val === 'string') return includedPlugins.push([ pluginTypeInfo.folder, val ]);
    // either object or array, store each 'name' value
    for(var i in val) {
      if (typeof val[i].name !== 'undefined') includedPlugins.push([ pluginTypeInfo.folder, val[i].name ]);
    }
  });
  return includedPlugins;
}

/**
 * Adds name of all plugins in includedPlugins to a list, goes to source_root/plugin_folder/plugin_name/bower.json,
 * extracts any pluginDependencies and adds their names to the list. Returns the list.
 * @param includedPlugins a list of all plugin types/names in the course
 * @param source_root the src folder in the temp framework directory
 * @param plugin_folder the folder in which the plugin can be found eg. extensions, components
 * @param plugin_name the name of the plugin
 * @param next callback
 */
OutputPlugin.prototype.addPluginWithDependencies = function (includedPlugins, source_root, plugin_folder, plugin_name, next) {
    var self = this;
    var bower_file = path.join(source_root, plugin_folder, plugin_name, Constants.Filenames.Bower);
    includedPlugins = self.getUpdatedIncludePlugins(includedPlugins, plugin_name);

    fs.readFile(bower_file, function(err, bower) {
        if (err) {
            logger.log('error', err);
            return next(err);
        }

        bower = JSON.parse(bower);
        if (bower.hasOwnProperty('pluginDependencies')) {
            for (var name in bower.pluginDependencies) {
                includedPlugins = self.getUpdatedIncludePlugins(includedPlugins, name);
            }
            return next();
        } else {
            return next();
        }
    });
};

OutputPlugin.prototype.getUpdatedIncludePlugins = function (includedPlugins, plugin_name) {
    if (_.indexOf(includedPlugins, plugin_name) === -1) {
        includedPlugins.push(plugin_name);
    }
    return includedPlugins;
};

OutputPlugin.prototype.writeCourseJSON = function(jsonObject, destinationFolder, next) {
  try {
    var outputJson = jsonObject;

    async.each(Object.keys(Constants.CourseCollections), function(collectionType, callback) {
      var propertiesToOmit = Constants.CourseCollections[collectionType].omitProps;

      if (propertiesToOmit) {
        // Remove any non-essential properties from the JSON.
        outputJson[collectionType] = _.omit(outputJson[collectionType], propertiesToOmit);
      }

      var data = JSON.stringify(outputJson[collectionType], undefined, 2);
      var filename = (collectionType === 'config')
        ? path.join(destinationFolder, Constants.CourseCollections[collectionType].filename)
        : path.join(destinationFolder, outputJson['config']._defaultLanguage, Constants.CourseCollections[collectionType].filename);

      fs.outputFile(filename, data, function(err) {
        if (err) {
          callback(err);
        } else {
          callback(null);
        }
      });
    }, function(err) {
      if (err) {
        logger.log('error', err);
        return next(err);
      }

      return next(null);
    });
  } catch (err) {
    logger.log('error', err);
    return next(err);
  }
};

OutputPlugin.prototype.buildFlagExists = function(pathToBuildFlag, next) {
  fs.stat(pathToBuildFlag, function(err, stats) {
    if (err) {
      if (err.code !== 'ENOENT') {
        logger.log('error', err);
      }
    }

    var exists = typeof stats == 'object';

    return next(null, exists);
  });
};

OutputPlugin.prototype.clearBuildFlag = function(pathToBuildFlag, next) {
  fs.unlink(pathToBuildFlag, function (err) {
    if (err && err.code !== 'ENOENT') {
      // Log the error, though being unable to remove the .rebuild file should
      // not be allowed break everything
      logger.log('error', err);
    };

    return next(null);
  });
};

OutputPlugin.prototype.applyTheme = function(tenantId, courseId, jsonObject, destinationFolder, next) {
  var self = this;
  var themeVariables = jsonObject.course[0].themeVariables;
  var themeName = jsonObject.config[0]._theme;

  database.getDatabase(function (err, db) {
    if (err) {
      return next(err, 'Unable to connect to database');
    }

    // Get the theme type
    db.retrieve('themetype', {name: themeName}, {}, function(err, results) {
      if (err || (results && results.length != 1)) {
        return next(err, 'Unable to retrieve themetype with name ' + themeName);
      }

      var theme = results[0];
      var THEME_ROOT = path.join(configuration.tempDir, configuration.getConfig('masterTenantID'), Constants.Folders.Framework, Constants.Folders.Source, Constants.Folders.Theme);
      var themeFolder = path.join(THEME_ROOT, theme.name);

      // Remove any current temporary theme folder
      fs.remove(destinationFolder, function(err) {
        if (err) return console.error(err);

        // Set up the temporary theme folder
        fs.copy(themeFolder, destinationFolder, function (err) {
          if (err) {
            logger.log('error', err);
            return next(err, 'Error copying ' + themeFolder + ' to ' + destinationFolder);
          }

          self.writeThemeVariables(courseId, theme, themeVariables, destinationFolder, function(error) {
            if (error) {
              return next(error);
            }
            // Theme customisations applied
            // Set the theme name to the course ID
            themeName = destinationFolder.replace(THEME_ROOT + path.sep,'');
            return next(null, themeName);
          });
        });
      });
    });
  }, configuration.getConfig('dbName'));
};

/**
 * Takes a theme and some themeVariables from a course. Any themeVariables with values different to those
 * in the theme are written to the destinationFolder as LESS.
 * @param courseId
 * @param theme
 * @param themeVariables
 * @param destinationFolder
 * @param next
 */
OutputPlugin.prototype.writeThemeVariables = function(courseId, theme, themeVariables, destinationFolder, next) {
  var destinationFile = path.join(destinationFolder, Constants.Folders.Less, Constants.Folders.CustomStyleDirectory, Constants.Filenames.Variables);
  var modifiedProperties = "";
  var props = {};
  var savedSettings = {};
  var SEPARATOR = '-';
  var themeAssetsFolder = path.join(destinationFolder, Constants.Folders.Assets);

  if (!themeVariables) {
    return next(null);
  }

  async.series([
    function(seriesCallback) {
      // Flatten the property names to allow two levels
      // This is in the case where an object has been used to group
      // theme properties
      var variables = theme.properties.variables;

      if (typeof variables !== 'object') {
        return seriesCallback(null);
      }

      async.eachSeries(Object.keys(variables), function(key, innerCallback) {
        var nestedProps = variables[key].properties;

        if (!nestedProps) {
          props[key] = key;
          return innerCallback();
        }

        // There are nested properties to process
        async.eachSeries(Object.keys(nestedProps), function(childKey, secondInnerCallback) {
          props[key + SEPARATOR + childKey] = childKey;
          theme.properties.variables[key + SEPARATOR + childKey] = variables[key].properties[childKey];

          secondInnerCallback();
        }, function(err) {
          if (!err) {
            delete theme.properties.variables[key];
          }

          innerCallback();
        });
      },
      function(err) {
        if (err) logger.log('error', 'Theme customisations 1 of 4');
        seriesCallback(err);
      });
    },
    function(seriesCallback) {
      // Now flatten the themeVariables
      async.eachSeries(Object.keys(themeVariables), function(key, innerCallback) {
        if (key !== '_type') {
          if (typeof themeVariables[key] === 'object') {
            // Iterate the properties and add them to the array
            async.each(Object.keys(themeVariables[key]), function(childKey, secondInnerCallback) {
              savedSettings[key + SEPARATOR + childKey] = themeVariables[key][childKey];

              secondInnerCallback();
            }, function(err) {
              if (err) {
                logger.log('error', 'Theme customisations 2 of 4 -- error flattening themeVariables');
              }
            });
          } else {
            savedSettings[key] = themeVariables[key];
          }
        }
        innerCallback();
      }, function(err) {
        if (err) {
          logger.log('error', 'Theme customisations 2 of 4');
          seriesCallback(err);
        } else {
          seriesCallback(null);
        }
      });
    },
    function(seriesCallback) {
      // Create LESS for properties
      async.each(Object.keys(props), function(prop, innerCallback) {
        var themeProperty = theme.properties.variables[prop];
        var inputType = themeProperty.inputType;
        // Check if the user has customised any properties
        if (savedSettings.hasOwnProperty(prop) && themeProperty.default !== savedSettings[prop]) {
          // The user has customised this property
          // Check if processing an image asset
          if (inputType.media === 'image' || inputType === 'Asset:image') {
            // Split the path so we can process the filename
            var assetPathArray = savedSettings[prop].split('/');
            // Encode the filename (removing spaces, etc.)
            assetPathArray[assetPathArray.length - 1] = encodeURIComponent(assetPathArray[assetPathArray.length - 1]);
            // Make the required substitution for image assets
            savedSettings[prop] = "\"" + assetPathArray.join('/').replace('course/', '') + "\"";
          }

          modifiedProperties += '@' + props[prop] + ': ' + savedSettings[prop] + ';\n';
        }
        innerCallback();
      }, function(err) {
        if (err) {
          logger.log('error', 'Theme customisations 3 of 4');
          seriesCallback(err);
        } else {
          seriesCallback(null);
        }
      });
    },
    function(seriesCallback) {
      // Delete old/write new LESS file
      if (modifiedProperties.length === 0) {
        // No theme customisation, clear file
        fs.removeSync(path.join(destinationFolder, Constants.Folders.Less, Constants.Folders.CustomStyleDirectory, Constants.Filenames.Variables));
        return seriesCallback(null);
      }

      fs.outputFile(destinationFile, modifiedProperties, 'utf8', function(err) {
        if (err) {
          logger.log('error', 'Theme customisations 4 of 4');
        }
        seriesCallback(err);
      });
    },
    function(seriesCallback) {
      var processedAssets = [];

      // Process assets
      database.getDatabase(function(err, db) {
        if (err) {
          return next(err);
        }

        db.retrieve('courseasset', {_courseId: courseId, _contentType: 'theme'}, function(err, results) {
          if (err) {
            seriesCallback(err);
            return;
          }
          if (!results) {
            // No assets to process
            seriesCallback(null);
            return;
          }

          // Process each asset in turn
          async.eachSeries(results, function(result, callback) {
            // Retrieve the asset details
            assetmanager.retrieveAsset({ _id: result._assetId}, function(error, assets) {
              if (error) {
                return callback(error);
              }

              var asset = assets[0],
                  outputFilename = path.join(themeAssetsFolder, asset.filename);

              if (processedAssets[asset.filename]) {
                return callback();
              }

              // Ensure that an asset is only copied once
              processedAssets[asset.filename] = true;

              // AB-59 - can't use asset record directly - need to use storage plugin
              filestorage.getStorage(asset.repository, function(err, storage) {
                if (err) {
                  logger.log('error', err.message, err);
                  return callback(err);
                }

                return storage && storage.createReadStream(asset.path, function(ars) {
                  var aws = fs.createWriteStream(outputFilename);
                  ars.on('error', function(err) {
                      return callback('Error copying ' + asset.path + ' to ' + outputFilename + ": " + err.message);
                  });
                  ars.on('end', function() {
                      return callback();
                  });
                  ars.pipe(aws);
                });
              });
            });
          }, function(err) {
            if (err) {
              logger.log('error', 'Unable to process theme assets');
              seriesCallback(err);
            } else {
              logger.log('info', 'All theme assets processed');
              seriesCallback(null, 'All theme assets processed')
            }
          });
        });
      });
    }
  ], function(error) {
    if (error) {
      logger.log('error', error);
    }

    return next(error);
  });
};

OutputPlugin.prototype.writeCustomStyle = function(tenantId, courseId, destinationFolder, next) {

  database.getDatabase(function(err, db) {
    if (err) {
      logger.log('error', err);
      return next(err);
    }

    db.retrieve('course', {_id: courseId}, {json: true}, function(err, results) {
      if (err) {
        logger.log('error', err);
        return next(err);
      }

      if (results && results.length == 1) {
        if (results[0].customStyle) {
          // There is a custom style applied
          var data = results[0].customStyle;
          var filename = path.join(destinationFolder, Constants.Folders.Less, Constants.Folders.CustomStyleDirectory, Constants.Filenames.CustomStyle);

          fs.outputFile(filename, data, 'utf8', function(err) {
            if (err) {
              logger.log('error', err);
              return next(err);
            }

            return next(null, 'Custom LESS file written');
          });
        } else {
          return next(null, 'No custom LESS file required');
        }
      } else {
        logger.log('info', 'More than one course record');
        return next(err);
      }
    });
  }, tenantId);
};

OutputPlugin.prototype.writeCourseAssets = function(tenantId, courseId, jsonDestinationFolder, destinationFolder, jsonObject, next) {

  fs.remove(destinationFolder, function(err) {
    if (err) {
      return next(err);
    }

    // Remove any existing assets
    fs.ensureDir(destinationFolder, function(err) {
      if (err) {
        return next(err);
      }

      // Fetch assets used in the course
      database.getDatabase(function (err, db) {
        if (err) {
          return next(err);
        }

        // Retrieve a distinct list of assets.
        db.retrieve('courseasset', {_courseId: courseId, _contentType: {$ne: 'theme'}}, {operators: {distinct: '_assetId'}}, function (err, results) {
          if (err) {
            logger.log('error', err);
            return next(err);
          }

          if (results) {
            var assetsJson = {};

            // Retrieve the details of every asset used in this course.
            assetmanager.retrieveAsset({ _id: {$in: results} }, function (error, assets) {
              if (error) {
                logger.log('error', err);
                return next(error);
              }

              async.eachSeries(assets, function(asset, callback) {
                var outputFilename = path.join(destinationFolder, asset.filename);

                assetsJson[asset.filename] = { 'title': asset.title, 'description': asset.description, 'tags': asset.tags };

                // TODO -- This global replace is intended as a temporary solution
                var replaceRegex = new RegExp("course/assets/" + asset.filename, 'gi');

                var lang = jsonObject['config']._defaultLanguage;
                var newAssetPath = "course/" + lang + "/assets/" + encodeURIComponent(asset.filename);

                Object.keys(Constants.CourseCollections).forEach(function(key) {
                  jsonObject[key] = JSON.parse(JSON.stringify(jsonObject[key]).replace(replaceRegex, newAssetPath));
                });

                // AB-59 - can't use asset record directly - need to use storage plugin
                filestorage.getStorage(asset.repository, function (err, storage) {
                  if (err) {
                    logger.log('error', err.message, err);
                    return callback(err);
                  }

                  return storage && storage.createReadStream(asset.path, function (ars) {
                    var aws = fs.createWriteStream(outputFilename);
                    ars.on('error', function (err) {
                      logger.log('error', 'Error copying ' + asset.path + ' to ' + outputFilename + ": " + err.message);
                      return callback('Error copying ' + asset.path + ' to ' + outputFilename + ": " + err.message);
                    });
                    ars.on('end', function () {
                      return callback();
                    });
                    ars.pipe(aws);
                  });
                });
              }, function(err) {
                if (err) {
                  logger.log('error', 'Error processing course assets');
                  return next(err);
                }
                var data = JSON.stringify(assetsJson, undefined, 2);
                var filename = path.join(jsonDestinationFolder, Constants.Filenames.Assets);

                fs.outputFile(filename, data, function(err) {
                  if (err) {
                    logger.log('error', 'Error saving assets.json');
                    return next(err);
                  }
                  logger.log('info', 'All assets processed');
                  return next(null, jsonObject);
                });
              });
            }); // retrieveAsset()
          } else {
            // There are no assets to process
            return next(null, jsonObject);
          }
        }); //courseasset
      }, tenantId);
    });  // ensureDir()
  });
};

OutputPlugin.prototype.applyMenu = function(tenantId, courseId, jsonObject, destinationFolder, next) {
  // Retrieve any menu customisations on this course
  var menuSettings = jsonObject['course'].hasOwnProperty('menuSettings')
      ? jsonObject['course'].menuSettings
      : false;

  menuName = jsonObject['config'].hasOwnProperty('_menu')
    ? jsonObject['config']._menu
    : false;

  // Check if the menu selected has customisations
  if (menuSettings) {
    // Get the menu ID from config
    var menuName = jsonObject['config']._menu;

    database.getDatabase(function (err, db) {
      if (err) {
        logger.log('error', err);
        return next(err, 'Unable to connect to database');
      }

      // Get the menu type
      db.retrieve('menutype', {name: menuName}, {}, function(err, results) {
        if (err) {
          return next(err, 'Unable to retrieve menutype with name ' + menuName);
        } else {
          if (results && results.length == 1) {
            var menu = results[0];
            var MENU_ROOT = path.join(configuration.tempDir, configuration.getConfig('masterTenantID'), Constants.Folders.Framework, Constants.Folders.Source, Constants.Folders.Menu);
            var menuFolder = path.join(MENU_ROOT, menu.name);

            // Remove any current temporary menu folder
            fs.remove(destinationFolder, function (err) {
              // Log the error but try to continue
              if (err) logger.log('error', err);

              fs.copy(menuFolder, destinationFolder, function (err) {
                if (err) {
                  return next(err);
                } else {
                  menuName = tenantId + '-' + courseId;

                  // Indicate that a different menu is being used
                  return next(null, menuName);
                }
              });
            });
          } else {
            // Something went wrong with the menu, but continue without customisations
            return next(null, menuName);
          }
        }
      });

    }, configuration.getConfig('dbName'));

  } else {
    // No menu specified -- use default
    return next(null, menuName);
  }
};

OutputPlugin.prototype.removeBuildIncludes = async (configPath, next) => {
  try {
    const config = await fs.readJson(configPath);
    await fs.writeJson(configPath, config, { spaces: 2, replacer: (key, value) => {
      if (key !== 'build') return value;
    }});
    next(null);
  } catch (err) {
    next(err);
  }
}

/**
 * extending plugins must implement this
 *
 * @return {string}
 */
OutputPlugin.prototype.preview = function (courseId, req, res, next) {
  logger.log('error', 'OutputPlugin#preview must be implemented by extending objects!');
  throw new Error('OutputPlugin#preview must be implemented by extending objects!');
};

/**
 * extending plugins must implement this
 *
 * @return {string}
 */
OutputPlugin.prototype.publish = function (courseId, req, res, next) {
  logger.log('error', 'OutputPlugin#publish must be implemented by extending objects!');
  throw new Error('OutputPlugin#publish must be implemented by extending objects!');
};

/**
 * extending plugins must implement this
 *
 * @return {string}
 */
OutputPlugin.prototype.export = function (courseId, req, res, next) {
  logger.log('error', 'OutputPlugin#export must be implemented by extending objects!');
  throw new Error('OutputPlugin#export must be implemented by extending objects!');
};

/**
 * Returns a string with double and single quote characters escaped
 *
 * @return {string}
 */
OutputPlugin.prototype.escapeQuotes = function(s) {

  if (typeof s !== 'string') {
    return '';
  }

  s = s.replace(/"/g,'\\"');
  s = s.replace(/'/g, "\\'");

  return s;
};

/**
 * OutputManager class
 */

function OutputManager () {
  this._outputTypes = Object.create(null);
}

// OutputManager is an eventemitter
util.inherits(OutputManager, EventEmitter);

/**
 * gets an output plugin instance
 *
 * @param {string} type - the type(name) of the output plugin
 * @param {callback} cb
 */

OutputManager.prototype.getOutputPlugin = function (type, cb) {
  var self = this;
  if (self._outputTypes[type]) {
    return cb(null, self._outputTypes[type]);
  }

  var pluginManager = pluginmanager.getManager();
  pluginManager.getPlugin('output', type, function (error, pluginInfo) {
    if (error) {
      return cb(new Error('output type plugin ' + type + ' was not found'));
    }

    try {
      var OutputPlugin = require(pluginInfo.fullPath);
      self._outputTypes[type] = new OutputPlugin(); // not sure we need to memoize
      cb(null, self._outputTypes[type]);
    } catch (err) {
      return cb(err);
    }
  });
};

/**
 * sets up rest service routes
 */
OutputManager.prototype.setupRoutes = function () {
  var that = this;

  // Publish for preview
  rest.get('/output/:type/preview/:courseid', function (req, res, next) {
    var type = req.params.type;
    var courseId = req.params.courseid;
    var user = usermanager.getCurrentUser();
    var mode = Constants.Modes.Preview;

    that.publish(type, courseId, mode, req, res, function (error, result) {
      if (error) {
        logger.log('error', error);
        return res.json({success: false, message: error.message});
      }

      return res.json({success: true, payload: result});
    });
  });

  rest.get('/output/:type/publish/:courseid', function (req, res, next) {
    logger.log('info', 'About to publish');
    var type = req.params.type;
    var courseId = req.params.courseid;
    var mode = Constants.Modes.Publish;

    that.publish(type, courseId, mode, req, res, function (error, result) {

      if (error) {
        logger.log('error', 'Unable to publish');
        return res.json({ success: false, message: error.message });
      }

      return res.json({success: true, payload: result});
    });
  });

};

["preview", "publish"].forEach( function (el, index, array) {
  OutputManager.prototype[el] = function () {
    var callargs = arguments;
    var args = Array.prototype.slice.call(arguments);
    var type = args.shift();
    var cb = args[args.length - 1];

    this.getOutputPlugin(type, function (error, plugin) {
      if (error) {
        return cb(error);
      }

      return plugin[el].apply(plugin, args);

    });
  };
});

exports = module.exports = {
  // expose the output manager constructor
  OutputManager : OutputManager,

  // expose the output plugin constructor
  OutputPlugin  : OutputPlugin,

  // expose the constants
  Constants : Constants,

  /**
   * preload function
   *
   * @param {object} app - the Origin instance
   * @return {object} preloader - a ModulePreloader
   */
  preload : function (app) {
    var preloader = new app.ModulePreloader(app, MODNAME, { events: this.preloadHandle(app, new OutputManager()) });
    return preloader;
  },

  /**
   * Event handler for preload events
   *
   * @param {object} app - Server instance
   * @param {object} instance - Instance of this module
   * @return {object} hash map of events and handlers
   */
  preloadHandle : function (app, instance){
    return {
        preload : function(){
          var preloader = this;
          preloader.emit('preloadChange', MODNAME, app.preloadConstants.WAITING);
        },
        moduleLoaded : function(modloaded){
          var preloader = this;
           //is the module that loaded this modules requirement
          if(modloaded === WAITFOR){
            app.outputmanager = instance;
            instance.setupRoutes();
            preloader.emit('preloadChange', MODNAME, app.preloadConstants.COMPLETE);
          }
        }
      };
  }
};
