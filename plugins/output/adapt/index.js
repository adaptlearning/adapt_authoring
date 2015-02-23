/**
 * Adapt Output plugin
 */

var OutputPlugin = require('../../../lib/outputmanager').OutputPlugin,
    configuration = require('../../../lib/configuration'),
    filestorage = require('../../../lib/filestorage'),
    database = require('../../../lib/database'),
    util = require('util'),
    path = require('path'),
    fs = require('fs'),
    async = require('async'),
    archiver = require('archiver'),
    _ = require('underscore'),
    ncp = require('ncp').ncp,
    rimraf = require('rimraf'),
    mkdirp = require('mkdirp'),
    usermanager = require('../../../lib/usermanager'),
    assetmanager = require('../../../lib/assetmanager'),
    exec = require('child_process').exec,
    logger = require('../../../lib/logger');

function AdaptOutput () {
}

util.inherits(AdaptOutput, OutputPlugin);

/**
 * Constants
 */
var EMPTY_BODY_TEXT = '<div><br></div>';
var TEMP_DIR = 'temp',
    SOURCE_DIR = 'src',
    BUILD_DIR = 'build',
    ASSETS_DIR = 'assets',
    COURSE_DIR = 'course',
    THEME_DIR = 'theme',
    MENU_DIR =  'menu',
    SCREENSHOTS_DIR = 'screenshots',
    COMPONENTS_DIR = 'components',
    ADAPT_FRAMEWORK_DIR = 'adapt_framework',
    ALL_COURSES = 'courses';

/**
 * Used to convert a string 's' to a valid filename
 */
function slugify(s) {
  var _slugify_strip_re = /[^\w\s-]/g;
  var _slugify_hyphenate_re = /[-\s]+/g;

  s = s.replace(_slugify_strip_re, '').trim().toLowerCase();
  s = s.replace(_slugify_hyphenate_re, '-');

  return s;
}

/**
 * implements OutputPlugin#preview
 *
 */
// AdaptOutput.prototype.preview = function (courseId, req, res, next) {
//   database.getDatabase(function (err, db) {
//     if (err) {
//       return next(err);
//     }

//     db.retrieve('course', { _id: courseId }, function (err, results) {
//       if (err) {
//         return next(err);
//       }

//       if (results && results.length) {
//         db.exportResults(results, function (transformed) {
//           return res.json(transformed);
//         });
//       }

//       res.statusCode = 404;
//       return res.end();
//     });
//   });
// };


/**
 * implements OutputPlugin#publish
 *
 */
AdaptOutput.prototype.publish = function (courseId, isPreview, req, res, next) {
  var user = usermanager.getCurrentUser(),
    tenantId = user.tenant._id,
    outputJson = {},
    friendlyIdentifiers = {},
    componentTypes,
    isRebuildRequired = false,
    themeName = 'adapt-contrib-vanilla';
    menuName = 'adapt-contrib-boxMenu';


  // Queries the database to return each collectionType for the given courseId
  var getJson = function (collectionType, doneCallback) {

    database.getDatabase(function(err, db) {
        var criteria = collectionType === 'course' ? {_id: courseId} : {_courseId: courseId};
        var options = {
          operators : {
            sort : { _sortOrder : 1}
          }
        };

        if (collectionType === 'config') {
          options.populate = { 
            _theme: 'name',
            _menu: 'name'
          };
        }

        db.retrieve(collectionType, criteria, options,
          function (error, results) {
            if (error) {
              doneCallback(error);
            } else if (results && results.length) {
              if (collectionType === 'config') {
                if (results[0]._theme && results[0]._theme.name) {
                  themeName = results[0]._theme.name;
                }
                if (results[0]._menu && results[0]._menu.name) {
                  menuName = results[0]._menu.name;
                }
              }

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

                doneCallback(null);
              });
            } else {
              outputJson[collectionType] = [];
              doneCallback(null);
            }
          }
        );
    }, tenantId);
  };

  // Replace the database _id value with something more user-friendly
  var setupFriendlyIdentifiers = function(key, doneCallback) {
    var tags = { 'contentobject' : 'co', 'article' : 'a', 'block' : 'b', 'component' : 'c'},
      items = [];

    friendlyIdentifiers[key] = [];

    var index = 0;

    // Iterate over the given JSON and set the friendly name for the '_id'
    async.eachSeries(outputJson[key], function(asdf, callback) {
       // Increment the index
      index = index + 1, newId = '';

      // This just sets some padding
      if (index.toString().length < 2) {
        newId = tags[key] + '-' + ('00' + index).slice(-2);
      } else {
        newId = tags[key] + '-' + index;
      }

      items.push({_id: outputJson[key][index-1]._id.toString(), identifier: newId});

      callback();

    }, function(error) {
      if (error) {
        return doneCallback(error);
      }

      // Write back the friendlyIdentifiers
      friendlyIdentifiers[key] = items;
      return doneCallback();
    });
  };
  
  // Writes Adapt Framework JSON files to the /course folder
  var writeJson = function(key, doneCallback) {
    var data = JSON.stringify(outputJson[key], undefined, 2),
      filepath = path.join(configuration.tempDir, tenantId, ADAPT_FRAMEWORK_DIR, ALL_COURSES, courseId, BUILD_DIR, COURSE_DIR),
      filenames = {},
      filename = '';

    filenames['course'] = 'course.json';
    filenames['config'] = 'config.json';
    filenames['contentobject'] = 'contentObjects.json';
    filenames['article'] = 'articles.json';
    filenames['block'] = 'blocks.json';
    filenames['component'] = 'components.json';

    if (key == 'config') {
      filename = path.join(filepath, filenames[key]);
    } else {
      filename = path.join(filepath, outputJson['config']._defaultLanguage, filenames[key]);
    }

    fs.writeFile(filename, data, function (error) {
      if (error) {
        doneCallback(error);
      } else {
        doneCallback(null);
      }
    });
  };

  // Verifies that a given folder exists and creates it if it does not
  var verifyFolder = function(folder, doneCallback) {
    fs.exists(folder, function(exists) {
      if (exists) {
        doneCallback(null, folder + ' folder OK');
      } else {
        fs.mkdir(folder, '0777', function(err) {
          if (err) {
            doneCallback(err, 'Error creating '  + folder);
          } else {
            doneCallback(null, folder + ' folder OK');
          }
        });
      }
    });
  };

  // Copies a specific version of the component to the source folder
  var copyComponentFiles = function(component, doneCallback) {
    var sourceFolder = path.join(configuration.serverRoot, '/plugins/content/component/versions/', component.name, component.version, component.name),
      destinationFolder = path.join(configuration.tempDir, courseId, user._id, SOURCE_DIR, COMPONENTS_DIR, component.name);

    ncp(sourceFolder, destinationFolder, function (err) {
      if (err) {
        doneCallback(err, 'Error copying ' + sourceFolder);
      } else {
        doneCallback(null);
      }
    });
  };

  // Queries the database to return each component used
  var getCourseComponents = function (doneCallback) {
    database.getDatabase(function(err, db) {
      var criteria = {_courseId: courseId};
      var options = {
        populate: [ '_componentType' ],
        operators : {
          sort : { _sortOrder : 1}
        }
      };

      db.retrieve('component', criteria, options, function (error, results) {
        if (error) {
          return doneCallback(error);
        }

        // Group our components by component type for efficiency
        var publishComponents = _.map(_.groupBy(results, function(item) {
          return item._componentType;
        }), function(grouped){
          return grouped[0]._componentType;
        });

        doneCallback(null, publishComponents);

      });
    }, tenantId);
  };

  // Get the JSON asynchronously
  async.each(['course', 'config', 'contentobject', 'article', 'block', 'component'], getJson, function (err) {

    // Call the steps to publish
    async.series([
      // Replace empty 'body' text
      function(callback) {
        logger.log('info', '0. Replace empty body text');

        var replaceEmptyBodyText = function(indexer, callback) {
          var processedJson = [];

          async.eachSeries(outputJson[indexer], function(jsonItem, innerCallback) {
            logger.log('info', jsonItem);

            if (jsonItem.body === EMPTY_BODY_TEXT) {
              jsonItem.body = '';
            }

            processedJson.push(jsonItem);
            innerCallback();
          }, function(err) {
            if (err) {
              callback(err);
            } else {
              // Set the JSON
              outputJson[indexer] = processedJson;
              callback(null);
            }
          });
        };

        async.each(['contentobject', 'article', 'block', 'component'], replaceEmptyBodyText, function (err) {
          if (!err) {
            callback(null, 'Empty body text replaced');
          } else {
            callback(err, 'Error replacing empty body text');
          }
        });
      },
      // Replace the database _id properties on the objects with something more user-friendly
      function(callback) {
        logger.log('info', '1. Setting up the user-friendly _id value array');

        async.each(['contentobject', 'article', 'block', 'component'], setupFriendlyIdentifiers, function (err) {
          if (!err) {
            callback(null, 'Friendly identifiers created');
          } else {
            callback(err, 'Error setting friendly identifiers');
          }
        });
      },
      // Verify that the temporary folder exists
      function(callback) {
        logger.log('info', '2. Verifying temporary folder exists');

        fs.exists(path.join(configuration.tempDir, tenantId, ADAPT_FRAMEWORK_DIR), function(exists) {
            if (exists) {
                // Do something
                callback(null, 'Temporary folder OK');
            } else {
              callback('Error');;
            }
        });
      },

      // function(callback) {
      //   logger.log('info', 'Getting componentTypes');

      //   database.getDatabase(function(err, db) {
      //     var criteria = null;
      //     var options = {
      //       operators : {
      //         sort : { name : 1}
      //       }
      //     };

      //     db.retrieve('componenttype', criteria, options,
      //       function (error, results) {
      //         if (error) {
      //           logger.log('error', error);
      //           callback(error);
      //         }
      //         else if (results && results.length) {
      //           db.exportResults(results, function (transformed) {
      //             var output = [];
      //             transformed && transformed.forEach(function (item) {
      //               // push the results onto our output collection
      //               output.push(item);
      //             });

      //             componentTypes = output;

      //             callback(null);
      //           });
      //         } else {
      //           componentTypes = null;
      //           callback(null);
      //         }
      //       }
      //     );
      //   }, tenantId);
      // },

      // Check if a .rebuild file exists in the course directory
      function(callback) {
        var rebuildFile = path.join(configuration.tempDir, tenantId, ADAPT_FRAMEWORK_DIR, ALL_COURSES, courseId, BUILD_DIR, '.rebuild');

        fs.exists(rebuildFile, function(exists) {
          isRebuildRequired = exists;

          if (exists) {
            fs.unlink(rebuildFile, function (err) {
              if (err) {
                // Log the error, though being unable to remove the .rebuild file should
                // not be allowed break everything
                logger.log('error', err);
              };

              logger.log('info', 'Rebuild required!');
              callback(null, 'Rebuild required!');
            });
          } else {
            logger.log('info', 'No rebuild required');
            callback(null, 'No rebuild required');
          }
        });
      },
      // Create the 'src' working folder
      function(callback) {
        logger.log('info', '3. Creating/verifying working folder');

        var workingRoot = path.join(configuration.tempDir, tenantId, ADAPT_FRAMEWORK_DIR, ALL_COURSES, courseId, BUILD_DIR),
          workingFolder = path.join(workingRoot, COURSE_DIR, outputJson['config'][0]._defaultLanguage);

        fs.exists(workingFolder, function(exists) {
          if (!exists) {
            // Create the folder from scratch
            mkdirp(workingFolder, function (err) {
              if (err) {
                callback(err, 'Problem occurred verifying working folders');
              } else {
                callback(null, 'Working folders verified');
              }
            });
          } else {
            // Remove old published files, then recreate the folder
            rimraf(workingFolder, function (err) {
              if (err) {
                callback(err, 'Problem occurred removing working folder');
              } else {
                mkdirp(workingFolder, function (err) {
                  if (err) {
                    callback(err, 'Problem occurred verifying working folder after removal');
                  } else {
                    callback(null, 'Working folder verified');
                  }
                });
              }
            });
          }
        });
      },
      function(callback){
        logger.log('info', 'Removing any temporary theme folder');

        var temporaryThemeFolder = path.join(configuration.tempDir, tenantId, ADAPT_FRAMEWORK_DIR, SOURCE_DIR, THEME_DIR, courseId);

        fs.exists(temporaryThemeFolder, function(exists) {
          if (exists) {
            logger.log('info', 'Removing any temporary theme folder');
            
            rimraf(temporaryThemeFolder, function(error) {
              if (error) {
                callback(error, 'Error removing ' + temporaryThemeFolder);
              } else {
                // A re-build is required if a custom theme previously existed
                callback(null, 'Removing previous theme folder');
              }
            });
          } else {
            callback(null);
          }
        });
      },
      function(callback) {
        logger.log('info', 'Possibly generating theme');

        // Retrieve any theme customisations on this course
        var themeSettings = outputJson['course'][0].hasOwnProperty('themeSettings') 
            ? outputJson['course'][0].themeSettings
            : false;

        // Check if the theme selected has customisations
        if (themeSettings) {
          // Get the theme ID from config
          var themeId = outputJson['config'][0]._theme;
          var options = {};

          database.getDatabase(function (err, db) {
            if (err) {
              callback(err, 'Unable to connect to database');
            } else {
              // Get the theme type
              db.retrieve('themetype', {_id: themeId}, options, function(err, results) {
                if (err) {
                  callback(err, 'Unable to retrieve themetype with _id ' + themeId);
                } else {
                  if (results && results.length == 1) {
                    var theme = results[0];
                    var themeFolder = path.join(configuration.tempDir, tenantId, ADAPT_FRAMEWORK_DIR, SOURCE_DIR, THEME_DIR, theme.name);

                    fs.exists(themeFolder, function (exists) {
                      if (exists) {
                        // Setup the tempoary theme folder
                        var temporaryThemeFolder = path.join(configuration.tempDir, tenantId, ADAPT_FRAMEWORK_DIR, SOURCE_DIR, THEME_DIR, courseId);

                        ncp(themeFolder, temporaryThemeFolder, function (err) {
                          if (err) {
                            callback(err, 'Error copying ' + themeFolder + ' to ' + temporaryThemeFolder);
                          } else {
                            // Make subsitutions in variables.less for any customisations
                            fs.readFile(path.join(temporaryThemeFolder, 'less', 'variables.less'), function(err, file) {
                              if (err) {
                                logger.log('error', err);
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
                                    }, function(err) {
                                      if (err) {
                                        logger.log('error', 'Theme customisations 1 of 4');
                                        seriesCallback(err);
                                      } else {
                                        logger.log('info', 'Theme customisations 1 of 4 OK');
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
                                              logger.log('error', 'Theme customisations 2 of 4 -- error flattening themSettings');
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
                                        logger.log('info', 'Theme customisations 2 of 4 OK');
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
                                          // Make the required substitution for image assets
                                          savedSettings[prop] = savedSettings[prop].replace('course/', '');
                                        }                                  

                                        var variableValue = (theme.properties[prop].default === "")
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
                                        logger.log('error', 'Theme customisations 3 of 4 OK');
                                        seriesCallback(err);
                                      } else {
                                        logger.log('info', 'Theme customisations 3 of 4 OK');
                                        seriesCallback(null);
                                      }
                                    });
                                  },
                                  function(seriesCallback) {
                                    // Save the modified variables.less file
                                    fs.writeFile(path.join(temporaryThemeFolder, 'less', 'variables.less'), file, 'utf8', function (err) {
                                      if (err) {
                                        logger.log('error', err);
                                        logger.log('error', 'Theme customisations 4 of 4');

                                        seriesCallback(err, 'Unable to write temporary variables.less');
                                      } else {
                                        // Set the theme name to the course ID
                                        themeName = courseId;
                                        logger.log('info', 'Theme customisations 4 of 4 OK');

                                        seriesCallback(null, 'Successfully using customised theme');
                                      }
                                    });
                                  }
                                ],
                                function(err, results) {
                                  if (err) {
                                    logger.log('error', 'Unable to apply theme customisations');
                                    callback(err);
                                  } else {
                                    logger.log('info', 'Theme customisations applied');
                                    callback(null, 'Theme OK');
                                  }
                                });                                
                              }
                            });
                          }
                        });
                      }
                    });
                  } else {
                    callback(null, 'Something went wrong with the theme, but continue without customisations');
                  }
                }
              });    
            }
          }, tenantId);
          
        } else {
          callback(null, 'Using original theme');
        }
        // Copy the current version of the theme into place
      },
      function(callback) {
         var themeSettings = outputJson['course'][0].hasOwnProperty('themeSettings') 
            ? outputJson['course'][0].themeSettings
            : false;

        // Check if the theme selected has customisations
        if (themeSettings) {
          logger.log('info', 'Deploying any custom theme images');

          // Fetch assets used in the course
          database.getDatabase(function (err, db) {
            if (err) {
              return next(err);
            }

            var destinationFolder = path.join(configuration.serverRoot, TEMP_DIR, tenantId, ADAPT_FRAMEWORK_DIR, SOURCE_DIR, THEME_DIR, courseId, ASSETS_DIR),
              processedAssets = [],
              processedTitles = [];

            db.retrieve('courseasset', {_courseId: courseId, _contentType: 'theme'}, function (err, results) {
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

                      // Check to see if the new name has the file extension of the unique name. Adds it if
                      // it's not there.
                      if (asset.title.substring(asset.title.lastIndexOf(".")) != asset.filename.substring(asset.filename.lastIndexOf("."))) {
                        asset.title = asset.title + asset.filename.substring(asset.filename.lastIndexOf("."));
                      }

                      // If the asset hasn't been processed, check to see if it shares a name with
                      // a previous asset. If it doesn't, output it with its proper name.
                      if (!processedTitles[asset.title]) {
                        processedTitles[asset.title] = true;
                      } else {
                        // If the asset does share a name, use a counter to iterate through all the
                        // assets with the same name and add a number to the name to uniquely identify it.
                        var title = asset.title;
                        var counter = 1;

                        while (processedTitles[asset.title]) {
                          asset.title = title.substring(0, title.lastIndexOf(".")) + "-" + counter + title.substring(title.lastIndexOf("."));
                          counter++;
                        }
                      }

                      outputFilename = path.join(destinationFolder, asset.filename);
                      processedTitles[asset.title] = true;

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
                    logger.log('error', 'Unable to process course asset');
                    return callback('Unable to process course asset')
                  } else {
                    logger.log('info', 'All assets processed');
                    return callback(null, 'All assets processed');
                  }
                });
              }
              else {
                callback(null, 'Theme assets processed');
              }
            });
            
          }, tenantId);

        } else {
          callback(null, 'No custom theme images to deploy');
        }
      },
      function(callback){
        logger.log('info', 'Removing any temporary menu folder');

        var temporaryMenuFolder = path.join(configuration.tempDir, tenantId, ADAPT_FRAMEWORK_DIR, SOURCE_DIR, MENU_DIR, courseId);

        fs.exists(temporaryMenuFolder, function(exists) {
          if (exists) {
            logger.log('info', 'Removing any temporary menu folder');
            
            rimraf(temporaryMenuFolder, function(error) {
              if (error) {
                callback(error, 'Error removing ' + temporaryMenuFolder);
              } else {
                // A re-build is required if a custom menu previously existed
                callback(null, 'Removing previous menu folder');
              }
            });
          } else {
            callback(null);
          }
        });
      },
      function(callback) {
        logger.log('info', 'Possibly generating menu');

        // Retrieve any menu customisations on this course
        var menuSettings = outputJson['course'][0].hasOwnProperty('menuSettings') 
            ? outputJson['course'][0].menuSettings
            : false;

        // Check if the menu selected has customisations
        if (menuSettings) {
          // Get the menu ID from config
          var menuId = outputJson['config'][0]._menu;
          var options = {};

          database.getDatabase(function (err, db) {
            if (err) {
              callback(err, 'Unable to connect to database');
            } else {
              // Get the menu type
              db.retrieve('menutype', {_id: menuId}, options, function(err, results) {
                if (err) {
                  callback(err, 'Unable to retrieve menutype with _id ' + menuId);
                } else {
                  if (results && results.length == 1) {
                    var menu = results[0];
                    var menuFolder = path.join(configuration.tempDir, tenantId, 'adapt_framework', 'src', 'menu', menu.name);

                    fs.exists(menuFolder, function (exists) {
                      if (exists) {
                        // Setup the tempoary menu folder
                        var temporaryMenuFolder = path.join(configuration.tempDir, tenantId, 'adapt_framework', 'src', 'menu', courseId);

                        ncp(menuFolder, temporaryMenuFolder, function (err) {
                          if (err) {
                            callback(err, 'Error copying ' + menuFolder + ' to ' + temporaryMenuFolder);
                          } else {
                            menuName = courseId;
                            callback(null, 'Using customised menu');
                          }
                        });
                      }
                    });
                  } else {
                    callback(null, 'Something went wrong with the menu, but continue without customisations');
                  }
                }
              });    
            }
          }, tenantId);
          
        } else {
          callback(null, 'Using original menu');
        }
        // Copy the current version of the menu into place
      },
      function(callback) {

        fs.exists(path.join(configuration.tempDir, tenantId, ADAPT_FRAMEWORK_DIR, ALL_COURSES, courseId, BUILD_DIR, 'index.html'), function (exists) {
          if (!exists || isRebuildRequired) {
            logger.log('info', '3.1. Ensuring framework build exists');

            var args = [];

            args.push('--outputdir=' + path.join(ALL_COURSES, courseId));
            args.push('--theme=' + themeName);
            args.push('--menu=' + menuName);


            logger.log('info', '3.2. Using theme: ' + themeName);
            logger.log('info', '3.3. Using menu: ' + menuName);

            logger.log('info', 'grunt server-build ' + args.join(' '));

            child = exec('grunt server-build ' + args.join(' '), {cwd: path.join(configuration.tempDir, tenantId, ADAPT_FRAMEWORK_DIR)},
              function (error, stdout, stderr) {
                if (error !== null) {
                  logger.log('error', 'exec error: ' + error);
                  return callback(error, 'Error building framework');
                }

                if (stdout.length != 0) {
                  logger.log('info', 'stdout: ' + stdout);
                  return callback(null, 'Framework built OK');
                }

                if (stderr.length != 0) {
                  logger.log('error', 'stderr: ' + stderr);
                  return callback(stderr, 'Error (stderr) building framework!');
                }

                return callback(null, 'Framework built');  
            });
          } else {
            callback(null, 'Framework already built, nothing to do')
          }
        });
      },
      // Sanatize course data
      function(callback) {
        logger.log('info', '4. Sanitizing course.json and contentobject.json');

        // The course JSON should be an object not an array
        var courseJson = outputJson['course'][0],
          contentObjectsJson = outputJson['contentobject'],
          courseId = courseJson._id;

        // The Adapt Framework expects the 'type' and '_id'
        // attributes of the course to be set to 'course'
        courseJson._type = 'course';
        courseJson._id = 'course';

        // Replace any reference to the original course _id value in contentObjects JSON
        for (var i = 0; i < contentObjectsJson.length; i++) {
          if (contentObjectsJson[i]._parentId.toString() == courseId) {
            contentObjectsJson[i]._parentId = 'course';
          }
        }

        // Store the sanitized JSON
        outputJson['course'] = courseJson;
        outputJson['contentobject'] = contentObjectsJson;

        callback(null, 'course.json sanitized');
      },
      // Sanitize config file
      function(callback) {
        logger.log('info', '5. Sanitizing config.json');

        // config.json should contain an object, not an array
        var configJson = outputJson['config'][0];

        outputJson['config'] = configJson;

        callback(null, 'config.json sanitized');
      },
      // Sanitize component data
      function(callback) {
        logger.log('info', '6. Sanitizing component JSON');
        var components = outputJson['component'];

        // The 'properties' property of a component should not be included as an
        // attribute in the output, but all its children should
        for (var i = 0; i < components.length; i++) {
          if (components[i].hasOwnProperty('properties')) {
            for(var key in components[i].properties){
              if (components[i].properties.hasOwnProperty(key)){
                 components[i][key] = components[i].properties[key];
              }
            }

            // Remove the 'properties' property
            delete components[i].properties;
          }
        }

        outputJson['component'] = components;
        callback(null, 'component.json sanitized');
      },
      // Process required assets
      function(callback) {
        logger.log('info', '7. Processing Course Assets');
        var destinationFolder = path.join(configuration.serverRoot,TEMP_DIR, tenantId, ADAPT_FRAMEWORK_DIR, ALL_COURSES, courseId, BUILD_DIR, COURSE_DIR, outputJson['config']._defaultLanguage, ASSETS_DIR),
          processedAssets = [];
          processedTitles = [];

        verifyFolder(destinationFolder, function (err) {
          if (err) {
            return callback(err, 'Error creating ' + destinationFolder);
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
                      outputFilename = path.join(destinationFolder, asset.title);

                    // Ensure that an asset is only copied once
                    if (!processedAssets[asset.filename]) {
                      processedAssets[asset.filename] = true;

                      // Check to see if the new name has the file extension of the unique name. Adds it if
                      // it's not there.
                      if (asset.title.substring(asset.title.lastIndexOf(".")) != asset.filename.substring(asset.filename.lastIndexOf("."))) {
                        asset.title = asset.title + asset.filename.substring(asset.filename.lastIndexOf("."));
                      }

                      // If the asset hasn't been processed, check to see if it shares a name with
                      // a previous asset. If it doesn't, output it with its proper name.
                      if (!processedTitles[asset.title]) {
                        processedTitles[asset.title] = true;
                      } else {
                        // If the asset does share a name, use a counter to iterate through all the
                        // assets with the same name and add a number to the name to uniquely identify it.
                        var title = asset.title;
                        var counter = 1;

                        while (processedTitles[asset.title]) {
                          asset.title = title.substring(0, title.lastIndexOf(".")) + "-" + counter + title.substring(title.lastIndexOf("."));
                          counter++;
                        }
                      }

                      outputFilename = path.join(destinationFolder, asset.title);
                      processedTitles[asset.title] = true;

                      // TODO -- This global replace is intended as a temporary solution
                      var replaceRegex = new RegExp("course/assets/" + asset.filename, 'gi');

                      outputJson['component'] = JSON.parse(JSON.stringify(outputJson['component']).replace(replaceRegex, "course/" + outputJson['config']._defaultLanguage + "/assets/" + asset.title));

                      // Subsitute in the friendly file name for contentObjects too
                      for (var i = 0; i < outputJson['contentobject'].length; i++) {
                        if (outputJson['contentobject'][i].hasOwnProperty('_graphic') && outputJson['contentobject'][i]._graphic.hasOwnProperty('src')
                          && outputJson['contentobject'][i]._graphic.src == "course/assets/" + asset.filename) {
                          outputJson['contentobject'][i]._graphic.src = "course/" + outputJson['config']._defaultLanguage + "/assets/" + asset.title;
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
                    return callback('Unable to process course asset')
                  } else {
                    logger.log('info', 'All assets processed');
                    return callback(null, 'All assets processed');
                  }
                });
              }
              else {
                callback(null, 'Assets processed');
              }
            });
            
          }, tenantId);
        });
      },
      // // Sanitize the IDs
      // function(callback) {
      //   logger.log('info', '8. Sanitizing the ID values');
      //   var types = ['contentobject', 'article', 'block', 'component'];

      //   // contentobject
      //   for (var i = 0; i < outputJson['contentobject'].length; i++) {
      //     var friendlyId = _.findWhere(friendlyIdentifiers['contentobject'], {_id: outputJson['contentobject'][i]._id.toString()});

      //     outputJson['contentobject'][i]._id = friendlyId.identifier;

      //     if (outputJson['contentobject'][i]._parentId.toString() !== 'course') {
      //       var friendlyParentId = _.findWhere(friendlyIdentifiers['contentobject'], {_id: outputJson['contentobject'][i]._parentId.toString()});
      //       outputJson['contentobject'][i]._parentId = friendlyParentId.identifier;
      //     }
      //   }

      //   // article
      //   for (var i = 0; i < outputJson['article'].length; i++) {
      //     var friendlyId = _.findWhere(friendlyIdentifiers['article'], {_id: outputJson['article'][i]._id.toString()});
      //     var friendlyParentId = _.findWhere(friendlyIdentifiers['contentobject'], {_id: outputJson['article'][i]._parentId.toString()});

      //     outputJson['article'][i]._id = friendlyId.identifier;
      //     outputJson['article'][i]._parentId = friendlyParentId.identifier;
      //   }

      //   // block
      //   for (var i = 0; i < outputJson['block'].length; i++) {
      //     var friendlyId = _.findWhere(friendlyIdentifiers['block'], {_id: outputJson['block'][i]._id.toString()});
      //     var friendlyParentId = _.findWhere(friendlyIdentifiers['article'], {_id: outputJson['block'][i]._parentId.toString()});

      //     outputJson['block'][i]._id = friendlyId.identifier;
      //     outputJson['block'][i]._parentId = friendlyParentId.identifier;

      //   }

      //   // component
      //   for (var i = 0; i < outputJson['component'].length; i++) {
      //     var friendlyId = _.findWhere(friendlyIdentifiers['component'], {_id: outputJson['component'][i]._id.toString()});
      //     var friendlyParentId = _.findWhere(friendlyIdentifiers['block'], {_id: outputJson['component'][i]._parentId.toString()});
      //     outputJson['component'][i]._id = friendlyId.identifier;
      //     outputJson['component'][i]._parentId = friendlyParentId.identifier;
      //   }

      //   callback(null, 'IDs changed');
      // },

      // Save the files here
      function(callback) {
        logger.log('info', '9. Saving JSON files');

        async.each(['course', 'contentobject', 'config', 'article', 'block', 'component'], writeJson, function (err) {
          if (!err) {
            callback(null, 'Files created');
          } else {
            callback(err, 'Error writing JSON files');
          }
        });
      },

      function(callback) {
        if (isPreview) {
          return callback(null, 'Preview, so no zip');
        } else {
          logger.log('info', '9. Zipping it all up');
          var output = fs.createWriteStream(path.join(configuration.tempDir, tenantId, ADAPT_FRAMEWORK_DIR, ALL_COURSES, courseId, 'download.zip')),
            archive = archiver('zip');

          output.on('close', function() {
            logger.log('info', 'done')
            callback(null, 'Zip file created');
          });
          archive.on('error', function(err) {
            callback(err, 'Error during zip');
          });

          archive.pipe(output);

          archive.bulk([
            { expand: true, cwd: path.join(configuration.tempDir, tenantId, ADAPT_FRAMEWORK_DIR, ALL_COURSES, courseId, BUILD_DIR), src: ['**/*'] }
          ]).finalize();
        }
      },
      // Other steps...
      function(callback) {
        if (isPreview) {
          return callback(null, 'Preview, so no download');
        } else {
          // Trigger the file download
          var filename = slugify(outputJson['course'].title),
            filePath = path.join(configuration.tempDir, tenantId, ADAPT_FRAMEWORK_DIR, ALL_COURSES, courseId, 'download.zip');

          fs.stat(filePath, function(err, stat) {
            if (err) {
              callback(err, 'Error calling fs.stat');
            } else {
              res.writeHead(200, {
                  'Content-Type': 'application/zip',
                  'Content-Length': stat.size,
                  'Content-disposition' : 'attachment; filename=' + filename + '.zip',
                  'Pragma' : 'no-cache',
                  'Expires' : '0'
              });

              var readStream = fs.createReadStream(filePath);

              readStream.pipe(res);
            }
          });
        }
      },

      function(callback) {
        database.getDatabase(function(err, db) {
          db.update('course', {_id: courseId}, {_hasPreview: true}, function(error, results) {
            if (error) {
              return callback(error);
            };
          });

          callback(null, "Preview is now available on dashboard");
        }, tenantId);
      }
    ],
    // optional callback
    function(err, results){
      results && results.forEach(function (el) {
        logger.log('info', el);
      });

      return next();
    });
  });

};

/**
 * implements OutputPlugin#importCourse
 *
 */
AdaptOutput.prototype.importCourse = function (req, res, next) {
  res.send('@TODO i should import a course now!');
  return next();
};

/**
 * Module exports
 *
 */

exports = module.exports = AdaptOutput;

