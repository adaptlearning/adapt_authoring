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
            filename: 'course.json'
        }, 
        'config': {
            tag: null,
            filename: 'config.json'
        }, 
        'contentobject': {
            tag: 'co',
            filename: 'contentObjects.json',
        }, 
        'article': {
            tag: 'a',
            filename: 'articles.json',
        },
        'block': {
            tag: 'b',
            filename: 'blocks.json',
        },
        'component' : {
            tag: 'c',
            filename: 'components.json'
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
      Main: 'main.html',
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

                // remove superflous ids from config items
                if (item._enabledExtensions) {
                  Object.keys(item._enabledExtensions).forEach(function (key){
                      delete item._enabledExtensions[key]._id;
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


OutputPlugin.prototype.writeCourseJSON = function(jsonObject, destinationFolder, next) {
  try {
    var self = this;

    var outputJson = jsonObject;

    async.each(Object.keys(Constants.CourseCollections), function(collectionType, callback) {
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

OutputPlugin.prototype.buildFlagExists = function(flagFile, next) {
  fs.exists(flagFile, function(exists) {
    if (exists) {
      fs.unlink(flagFile, function (err) {
        if (err) {
          // Log the error, though being unable to remove the .rebuild file should
          // not be allowed break everything
          logger.log('error', err);
        };

        return next(null, exists);
      });
    } else {
      return next(null, exists);
    }
  });
};

OutputPlugin.prototype.applyTheme = function(tenantId, courseId, jsonObject, destinationFolder, next) {
  var themeSettings = jsonObject['course'].hasOwnProperty('themeSettings') 
      ? jsonObject['course'].themeSettings
      : false;

  var themeName = jsonObject['config'].hasOwnProperty('_theme')
    ? jsonObject['config']._theme
    : Constants.Defaults.ThemeName;

  var customStyle = jsonObject['course'].hasOwnProperty('customStyle')
    ? jsonObject['course'].customStyle
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
                            ? '"' + savedSettings[prop] + '"' // Include quotes
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
                      var processedAssets = [],
                        processedTitles = [];
                        destinationFolder = path.join(destinationFolder, Constants.Folders.Assets);

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
                                  outputFilename = path.join(destinationFolder, asset.filename);

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
  var self = this;

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
  var processedAssets = [];
    processedTitles = [];

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

        db.retrieve('courseasset', {_courseId: courseId}, function (err, results) {
          if (err) {
            return next(err);
          }

          if (results) {
            // Process each asset
            async.eachSeries(results, function(result, callback) {

              // Retrieve the asset details
              assetmanager.retrieveAsset({ _id: result._assetId }, function (error, assets) {
                if (error) {
                  return callback(error);
                } 
                
                var asset = assets[0],
                  outputFilename = path.join(destinationFolder, asset.filename);

                // Ensure that an asset is only copied once
                if (!processedAssets[asset.filename]) {
                  processedAssets[asset.filename] = true;

                  // TODO -- This global replace is intended as a temporary solution
                  var replaceRegex = new RegExp("course/assets/" + asset.filename, 'gi');

                  jsonObject['component'] = JSON.parse(JSON.stringify(jsonObject['component']).replace(replaceRegex, "course/" + jsonObject['config']._defaultLanguage + "/assets/" + encodeURIComponent(asset.filename)));
                  jsonObject['course'] = JSON.parse(JSON.stringify(jsonObject['course']).replace(replaceRegex, "course/" + jsonObject['config']._defaultLanguage + "/assets/" + encodeURIComponent(asset.filename)));

                  // Substitute in the friendly file name for contentObjects too
                  for (var i = 0; i < jsonObject['contentobject'].length; i++) {
                    if (jsonObject['contentobject'][i].hasOwnProperty('_graphic') && jsonObject['contentobject'][i]._graphic.hasOwnProperty('src')
                      && jsonObject['contentobject'][i]._graphic.src == "course/assets/" + asset.filename) {
                      jsonObject['contentobject'][i]._graphic.src = "course/" + jsonObject['config']._defaultLanguage + "/assets/" + encodeURIComponent(asset.filename);
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
                } else {
                  return callback();
                }
              });
            }, function(err) {
              if (err) {
                logger.log('error', 'Unable to process course asset');
                return next(err);
              } 
                
              logger.log('info', 'All assets processed');
              return next(null, jsonObject);
            });
          }
          else {
            // There are no assets to process
            return next(null, jsonObject);
          }
        });
        
      }, tenantId);
    });
    
  });
  
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
          callback(err, 'Unable to retrieve menutype with name ' + menuName);
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
 * Returns a slugified string, e.g. for use in a published filename
 *
 * @return {string}
 */
OutputPlugin.prototype.slugify = function(s) {
 var _slugify_strip_re = /[^\w\s-]/g;
  var _slugify_hyphenate_re = /[-\s]+/g;

  s = s.replace(_slugify_strip_re, '').trim().toLowerCase();
  s = s.replace(_slugify_hyphenate_re, '-');

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
      
      logger.log('info', result);
      return res.json({success: true, payload: result});
      // next(null, result);
      // Redirect to preview
      //res.redirect('/preview/' + user.tenant._id + '/' + courseId + '/main.html');
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

      return res.end();
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
