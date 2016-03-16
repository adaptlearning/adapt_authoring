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
    rimraf = require('rimraf'),
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
    Defaults: {
        ThemeName : 'adapt-contrib-vanilla',
        MenuName : 'adapt-contrib-boxMenu'
    },
    Folders: {
        Source: 'src',
        Build: 'build',
        Assets: 'assets',
        Exports: 'exports',
        Course: 'course',
        AllCourses: 'courses',
        Theme: 'theme',
        Temp: 'temp',
        Menu: 'menu',
        Less: 'less',
        Framework: 'adapt_framework'
    },
    Filenames: {
      Download: 'download.zip',
      Main: 'index.html',
      Rebuild: '.rebuild',
      CustomStyle: 'zzzzz.less',
      Variables: 'variables.less'
    }
};

/**
 * base constructor for Output plugins
 * @api public
 */
function OutputPlugin () {

}



OutputPlugin.prototype.getCourseJSON = function(tenantId, courseId, next) {
  var self = this;
  var outputJson = {};

  logger.log('info', 'Retrieving JSON');
  database.getDatabase(function(err, db) {
    if (err) {
      logger.log('error', err);
      return err;
    }

    async.each(Object.keys(Constants.CourseCollections), function(collectionType, callback) {
      // Set the courseId correctly
      var criteria = collectionType === 'course'
        ? {_id: courseId}
        : {_courseId: courseId};

      if (collectionType == 'config') {

        origin().contentmanager.getContentPlugin('config', function (err, contentPlugin) {
          if (err) {
            return callback(err);
          }

          contentPlugin.retrieve(criteria, {}, function(err, config) {
            if (err) {
              return callback(err);
            }

            if (config.length !== 1) {
              return callback(new Error('Preview/Publish: Unable to retrieve config.json'));
            }

            // Move any _extensions on the config.json into place.
            if (config[0]._extensions) {
              Object.keys(config[0]._extensions).forEach(function (key) {
                if(!config[0][key]) { // don't allow extensions to overwrite core attributes
                  config[0][key] = config[0]._extensions[key];
                }
              });
            }

            // Remove _extensions from config.json.
            delete config[0]._extensions;

            outputJson[collectionType] = config;

            callback(null);
          });
        });
      } else {

        db.retrieve(collectionType, criteria, {operators: { sort: { _sortOrder: 1}}},
          function (error, results) {
            if (error) {
              callback(error);
            } else if (results && results.length) {
              db.exportResults(results, function (transformed) {
                var output = [];
                transformed && transformed.forEach(function (item) {
                  // move the _extensions into place
                  if (item._extensions) {
                    Object.keys(item._extensions).forEach(function (key) {
                      if(!item[key]) { // don't allow extensions to overwrite core attributes
                        item[key] = item._extensions[key];
                      }
                    });
                  }

                  // remove the _extensions property from the json
                  delete item._extensions;

                  // push the results onto our output collection
                  output.push(item);
                });

                outputJson[collectionType] = output;

                callback(null);
              });
            } else {
              outputJson[collectionType] = [];
              callback(null);
            }
          }
        );
      }
    }, function(err) {
        if (err) {
            logger.log('error', err);
            return next(err);
        }

        return next(null, outputJson);
    });

  }, tenantId);

};

/**
 * Sanatizes the component
 *
 */
OutputPlugin.prototype.sanitizeCourseJSON = function(json, next) {
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

    // Append the 'build' property to config
    configJson.build = {
      includes: this.generateIncludesForConfig(configJson)
    };

    // Store the sanitized JSON
    outputJson['course'] = courseJson;
    outputJson['contentobject'] = contentObjectJson;
    outputJson['config'] = configJson;
    outputJson['component'] = componentJson;

    return next(null, outputJson);
  } catch(err) {
    return next(err);
  }
};

OutputPlugin.prototype.generateIncludesForCourse = function(courseId, next) {
    var self = this;
    async.waterfall([
        function getContentPlugin(callback) {
            origin().contentmanager.getContentPlugin('config', callback);
        },
        function getConfig(contentPlugin, callback) {
            contentPlugin.retrieve({_courseId: courseId}, {}, callback);
        },
        function getIncludes(config, callback) {
            var includes = self.generateIncludesForConfig(config[0]);
            if(!includes) callback(new Error("No plugins included for course " + courseId));
            else callback(null, includes);
        }
    ], next);
};

// Process the 'config' object to hold the plugins
OutputPlugin.prototype.generateIncludesForConfig = function(config) {
  var includedPlugins = [];
  var menu = config.hasOwnProperty('_menu')
    ? config._menu
    : Constants.Defaults.MenuName;
  var theme = config.hasOwnProperty('_theme')
    ? config._theme
    : Constants.Defaults.ThemeName;

  // ensure the theme and menu are compiled
  includedPlugins = [theme, menu];

  // Process the extensions
  if (config.hasOwnProperty('_enabledExtensions')) {
    for (var i in config._enabledExtensions) {
      includedPlugins.push(config._enabledExtensions[i].name);
    }
  }

  // Process the components
  if (config.hasOwnProperty('_enabledComponents')) {
    for (var i in config._enabledComponents) {
      includedPlugins.push(config._enabledComponents[i].name);
    }
  }

  // Fixes #1033 - it looks like a hack but there is no way around this until the dependencies
  // are resolved.
  if (_.indexOf(includedPlugins, 'adapt-contrib-hotgraphic') > -1 && _.indexOf(includedPlugins, 'adapt-contrib-narrative') == -1) {
    includedPlugins.push('adapt-contrib-narrative');
  }

  if (_.indexOf(includedPlugins, 'adapt-contrib-gmcq') > -1 && _.indexOf(includedPlugins, 'adapt-contrib-mcq') == -1) {
    includedPlugins.push('adapt-contrib-mcq');
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

  var themeAssetsFolder = path.join(destinationFolder, Constants.Folders.Assets);
  var themeSettings = jsonObject['course'][0].hasOwnProperty('themeSettings')
    ? jsonObject['course'][0].themeSettings
    : false;

  var themeName = jsonObject['config'][0].hasOwnProperty('_theme')
    ? jsonObject['config'][0]._theme
    : Constants.Defaults.ThemeName;

  var customStyle = jsonObject['course'][0].hasOwnProperty('customStyle')
    ? jsonObject['course'][0].customStyle
    : false;

  // Check if the theme selected has customisations or if custom styling has beeen applied
  if (themeSettings || customStyle) {
    database.getDatabase(function (err, masterDb) {
      if (err) {
        return next(err, 'Unable to connect to database');
      }

      // Get the theme type
      masterDb.retrieve('themetype', {name: themeName}, {}, function(err, results) {
        if (err || (results && results.length != 1)) {
          return next(err, 'Unable to retrieve themetype with name ' + themeName);
        }

        var theme = results[0];
        var THEME_ROOT = path.join(configuration.tempDir, configuration.getConfig('masterTenantID'), Constants.Folders.Framework, Constants.Folders.Source, Constants.Folders.Theme);
        var themeFolder = path.join(THEME_ROOT, theme.name);

        // Remove any current temporary theme folder
        fs.remove(destinationFolder, function(err) {
          if (err) return console.error(err)

          // Setup the tempoary theme folder
          fs.copy(themeFolder, destinationFolder, function (err) {
            if (err) {
              logger.log('error', err);
              return next(err, 'Error copying ' + themeFolder + ' to ' + destinationFolder);
            }

            // Make subsitutions in variables.less for any customisations
            if (themeSettings) {
              fs.readFile(path.join(destinationFolder, Constants.Folders.Less, Constants.Filenames.Variables), function(err, file) {
                if (err) {
                  logger.log('error', err);
                  return next(null, themeName);
                }

                if (theme.properties) {
                  file = file.toString();

                  var SEPARATOR = '-',
                    props = [],
                    savedSettings = [];

                  // The theme should have defaults defined
                  // Get the less variable names that should be replaced
                  async.series([
                    function(seriesCallback) {
                      // Flatten the property names to allow two levels
                      // This is in the case where an object has been used to group
                      // theme properties
                      async.eachSeries(_.keys(theme.properties), function(key, innerCallback) {
                        if (theme.properties[key].hasOwnProperty('properties')) {
                          // There are nested properties to process
                          async.eachSeries(_.keys(theme.properties[key].properties), function(childKey, secondInnerCallback) {
                            props.push(key + SEPARATOR + childKey);
                            theme.properties[key + SEPARATOR + childKey] = theme.properties[key].properties[childKey];

                            secondInnerCallback();
                          }, function(err) {
                            if (!err) {
                              delete theme.properties[key];
                            }

                            innerCallback();
                          });
                        } else {
                          // Push the property as is
                          props.push(key);
                          innerCallback();
                        }
                      },
                      function(err) {
                        if (err) {
                          logger.log('error', 'Theme customisations 1 of 4');
                          seriesCallback(err);
                        } else {
                          seriesCallback(null);
                        }
                      });
                    },
                    function(seriesCallback) {
                      // Now flatten the themeSettings
                      async.eachSeries(_.keys(themeSettings), function(key, innerCallback) {
                        if (key !== '_type') {
                          if (typeof themeSettings[key] === 'object') {
                            // Iterate the properies and add them to the array
                            async.each(_.keys(themeSettings[key]), function(childKey, secondInnerCallback) {
                              savedSettings[key + SEPARATOR + childKey] = themeSettings[key][childKey];

                              secondInnerCallback();
                            }, function(err) {
                              if (err) {
                                logger.log('error', 'Theme customisations 2 of 4 -- error flattening themeSettings');
                              }
                            });
                          } else {
                            savedSettings[key] = themeSettings[key];
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
                      // Make the substitutions in the JSON file
                      async.each(props, function(prop, innerCallback) {
                        // Check if the user has customised any properties
                        if (savedSettings.hasOwnProperty(prop) && theme.properties[prop].default !== savedSettings[prop]) {
                          // The user has customised this property

                          // Check if processing an image asset
                          if (theme.properties[prop].inputType === 'Asset:image') {
                            // Split the path so we can process the filename
                            var assetPathArray = savedSettings[prop].split('/');

                            // Encode the filename (removing spaces, etc.)
                            assetPathArray[assetPathArray.length - 1] = encodeURIComponent(assetPathArray[assetPathArray.length - 1]);

                            // Make the required substitution for image assets
                            savedSettings[prop] = assetPathArray.join('/').replace('course/', '');
                          }

                          var variableValue = (typeof theme.properties[prop].quoted !== 'undefined' && theme.properties[prop].quoted)
                            ? '"' +  self.escapeQuotes(savedSettings[prop]) + '"' // Include quotes
                            : savedSettings[prop];

                          // Substitute in the new variable values
                          // Search for LESS variables in the following format:
                          // @variable-name: 'whatever';
                          var pattern = theme.properties[prop].less + ':{1}[^;]+;';
                          var regex = new RegExp(pattern);

                          file = file.replace(regex, theme.properties[prop].less + ': ' + variableValue + '; // *');
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
                      // Save the modified variables.less file
                      fs.writeFile(path.join(destinationFolder, Constants.Folders.Less, Constants.Filenames.Variables), file, 'utf8', function (err) {
                        if (err) {
                          logger.log('error', 'Theme customisations 4 of 4');

                          seriesCallback(err);
                        } else {
                          // Set the theme name to the course ID
                          themeName = tenantId + '-' + courseId;

                          seriesCallback(null);
                        }
                      });
                    },
                    function(seriesCallback) {
                      var processedAssets = [];

                      // Process assets
                      database.getDatabase(function (err, db) {
                        if (err) {
                          return next(err, 'Unable to connect to database');
                        }

                        db.retrieve('courseasset', {_courseId: courseId, _contentType: 'theme'}, function (err, results) {
                          if (err) {
                            seriesCallback(err);
                          } else if (results) {
                            // Process each asset in turn
                            async.eachSeries(results, function(result, callback) {

                              // Retrieve the asset details
                              assetmanager.retrieveAsset({ _id: result._assetId}, function (error, assets) {
                                if (error) {
                                  return callback(error);
                                }

                                var asset = assets[0],
                                  outputFilename = path.join(themeAssetsFolder, asset.filename);

                                // Ensure that an asset is only copied once
                                if (!processedAssets[asset.filename]) {
                                  processedAssets[asset.filename] = true;

                                  // AB-59 - can't use asset record directly - need to use storage plugin
                                  filestorage.getStorage(asset.repository, function (err, storage) {
                                    if (err) {
                                      logger.log('error', err.message, err);
                                      return callback(err);
                                    }

                                    return storage && storage.createReadStream(asset.path, function (ars) {
                                      var aws = fs.createWriteStream(outputFilename);
                                      ars.on('error', function (err) {
                                        return callback('Error copying ' + asset.path + ' to ' + outputFilename + ": " + err.message);
                                      });
                                      ars.on('end', function () {
                                        return callback();
                                      });
                                      ars.pipe(aws);
                                    });
                                  });
                                } else {
                                  return callback();
                                }
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
                          }
                          else {
                            // No assets to process
                            seriesCallback(null);
                          }
                        });
                      });
                    }
                  ],
                  function(err, results) {
                    if (err) {
                      logger.log('error', err);
                      return next(err);
                    }

                    // Theme customisations applied
                    return next(null, themeName);
                  });
                }
              });
            } else {
              // There are no theme customisations, but the directory structure
              // has been setup to
              logger.log('info', 'No theme customisations, but custom CSS/LESS');
              // Set the theme name to the course ID
              themeName = tenantId + '-' + courseId;
              return next(null, themeName);
            }

          });

        });

      });
    }, configuration.getConfig('dbName'));

  } else {
    // No theme customisation, use specified theme
    return next(null, themeName);
  }
};

/**
 *
 *
 */
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
          var filename = path.join(destinationFolder, Constants.Folders.Less, Constants.Filenames.CustomStyle);

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

OutputPlugin.prototype.writeCourseAssets = function(tenantId, courseId, destinationFolder, jsonObject, next) {

  rimraf(destinationFolder, function(err) {
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
            // Retrieve the details of every asset used in this course.
            assetmanager.retrieveAsset({ _id: {$in: results} }, function (error, assets) {
              if (error) {
                logger.log('error', err);
                return next(error);
              }

              async.eachSeries(assets, function(asset, callback) {
                var outputFilename = path.join(destinationFolder, asset.filename);

                // TODO -- This global replace is intended as a temporary solution
                var replaceRegex = new RegExp("course/assets/" + asset.filename, 'gi');

                var lang = jsonObject['config']._defaultLanguage;
                var newAssetPath = "course/" + lang + "/assets/" + encodeURIComponent(asset.filename);

                Object.keys(Constants.CourseCollections).forEach(function(key) {
                  if (key === 'contentobject') {
                    return;
                  }
                  jsonObject[key] = JSON.parse(JSON.stringify(jsonObject[key]).replace(replaceRegex, newAssetPath));
                });

                // Substitute in the friendly file name for contentObjects too
                for (var i = 0; i < jsonObject['contentobject'].length; i++) {
                  var co = jsonObject['contentobject'][i];
                  if (co.hasOwnProperty('_graphic') && co._graphic.hasOwnProperty('src')
                    && co._graphic.src.search(replaceRegex) !== -1) {
                    co._graphic.src = newAssetPath;
                  }
                }

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

                logger.log('info', 'All assets processed');
                return next(null, jsonObject);
              });
            }); // retrieveAsset()
          } else {
            // There are no assets to process
            return next(null, jsonObject);
          }
        }); //courseasset
      }, tenantId);
    });  // ensureDir()
  }); // rimRaf()
};

OutputPlugin.prototype.applyMenu = function(tenantId, courseId, jsonObject, destinationFolder, next) {
  // Retrieve any menu customisations on this course
  var menuSettings = jsonObject['course'].hasOwnProperty('menuSettings')
      ? jsonObject['course'].menuSettings
      : false;

  menuName = jsonObject['config'].hasOwnProperty('_menu')
    ? jsonObject['config']._menu
    : Constants.Defaults.MenuName;

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

            // Remove any current temporary theme folder
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
    var preview = true;

    that.publish(type, courseId, preview, req, res, function (error, result) {
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
    var preview = false;
    that.publish(type, courseId, preview, req, res, function (error, result) {

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
   * @param {object} app - AdaptBuilder instance
   * @return {object} preloader - an AdaptBuilder ModulePreloader
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
