/**
 * Adapt Output plugin
 */

var OutputPlugin = require('../../../lib/outputmanager').OutputPlugin,
    configuration = require('../../../lib/configuration'),
    database = require('../../../lib/database'),
    util = require('util'),
    path = require('path'),
    database = require('../../../lib/database'),
    fs = require('fs'),
    async = require('async'),
    archiver = require('archiver'),
    _ = require('underscore'),
    ncp = require('ncp').ncp,
    rimraf = require('rimraf'),
    mkdirp = require('mkdirp'),
    usermanager = require('../../../lib/usermanager'),
    logger = require('../../../lib/logger');

function AdaptOutput () {
}

util.inherits(AdaptOutput, OutputPlugin);

/**
 * Constants
 */
var TEMP_DIR = 'temp',
    SOURCE_DIR = 'src',
    BUILD_DIR = 'build';
    BESPOKE_DIR = 'bespoke',
    COURSE_DIR = 'course',   
    COMPONENTS_DIR = 'components',
    CORE_DIR = 'core',
    EXTENSIONS_DIR = 'extensions',
    LESS_DIR = 'less',
    MENU_DIR = 'menu',
    TEMPLATES_DIR = 'templates',
    THEME_DIR = 'theme',
    FRAMEWORK_SOURCE_DIR = '/framework/build/';

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
AdaptOutput.prototype.preview = function (courseId, req, res, next) {

  database.getDatabase(function (err, db) {
    if (err) {
      return next(err);
    }

    db.retrieve('course', { _id: courseId }, function (err, results) {
      if (err) {
        return next(err);
      }

      if (results && results.length) {
        db.exportResults(results, function (transformed) {
          return res.json(transformed);
        });
      } 

      res.statusCode = 404;
      return res.end();
    });
  });
};


/**
 * implements OutputPlugin#publish
 *
 */
AdaptOutput.prototype.publish = function (courseId, req, res, next) {
  var outputJson = {};
  var user = usermanager.getCurrentUser();

  // Queries the database to return each collectionType for the given courseId
  var getJson = function (collectionType, doneCallback) {

    database.getDatabase(function(err, db) {
        var criteria = collectionType == 'course' ? {_id: courseId} : {_courseId: courseId};

        db.retrieve(collectionType, criteria, 
          function (error, results) {
            if (error) {
              doneCallback(error);
            } 
            else if (results && results.length) {
              db.exportResults(results, function (transformed) {
                outputJson[collectionType] = transformed;

                doneCallback(null);
              });
            } else {
              outputJson[collectionType] = [];
              doneCallback(null);
            }
          }
        );     
    });
  };

  // Writes Adapt Framework JSON files to the /course folder
  var writeJson = function(key, doneCallback) {  
    var filenames = {};
    filenames['course'] = 'course.json';
    filenames['config'] = 'config.json';
    filenames['contentobject'] = 'contentObjects.json';
    filenames['article'] = 'articles.json';
    filenames['block'] = 'blocks.json';
    filenames['component'] = 'components.json';

    var data = JSON.stringify(outputJson[key], undefined, 2);
    var filepath = path.join(TEMP_DIR, courseId, user._id, BUILD_DIR, COURSE_DIR);
    var filename;

    if (key == 'config') {
      filename = path.join(filepath, filenames[key]);
    } else {
      filename = path.join(filepath, outputJson['config'][0]._defaultLanguage, filenames[key]);
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
    var sourceFolder = path.join(process.cwd(), '/plugins/content/component/versions/', component.name, component.version, component.name);
    var destinationFolder = path.join(process.cwd(), TEMP_DIR, courseId, user._id, SOURCE_DIR, COMPONENTS_DIR, component.name);

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
        populate: [ '_componentType' ]
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
    });
  };

  // Get the JSON asynchronously
  async.each(['course', 'config', 'contentobject', 'article', 'block', 'component'], getJson, function (err) {

    // Call the steps to publish
    async.series([
      // Verify that the temporary folder exists
      function(callback) {
        logger.log('info', '1. Verifying temporary folder exists');

        fs.exists(TEMP_DIR, function(exists) {
            if (exists) {
                // Do something
                callback(null, 'Temporary folder OK');
            } else {
              fs.mkdir(TEMP_DIR, '0777', function(err) {
                if (err) {
                  callback(err, 'Unable to make temporary folder');
                } else {
                  callback(null, 'Temporary folder OK');
                }
              });
            }
        });
      },
      // Create the 'src' working folder
      function(callback) {
        logger.log('info', '2. Verifying working folder');

        var workingRoot = path.join(TEMP_DIR, courseId, user._id, BUILD_DIR);
        var workingFolder = path.join(workingRoot, COURSE_DIR, outputJson['config'][0]._defaultLanguage);

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
      // Sanatize course data
      function(callback) {
        logger.log('info', '3. Sanitizing course JSON');
        var courseJson = outputJson['course'];
 
        // Don't leave it as an array
        var str = JSON.stringify(outputJson['course']);
        str = str.substring(1);
        str = str.slice(0, -1);
        courseJson = JSON.parse(str);

        // Replace the type
        courseJson._type = 'course';

        outputJson['course'] = courseJson;

        callback(null, 'course.json sanatized');
      },
      // Sanatize component data
      function(callback) {
        logger.log('info', '4. Sanitizing component JSON');
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
        callback(null, 'component.json sanatized');
      },

      function(callback) {
        logger.log('info', '5. Copying build folder to temp directory');
        var sourceFolder = path.join(process.cwd(), '/framework/build/');
        var destinationFolder = path.join(process.cwd(), TEMP_DIR, courseId, user._id, BUILD_DIR);

        ncp(sourceFolder, destinationFolder, function (err) {
          if (err) {
            callback(err, 'Error copying Framework from ' + sourceFolder);
          } else {
            callback(null);
          }
        });

      },
      // Save the files here
      function(callback) {
        logger.log('info', '6. Saving JSON files');

        async.each(['course', 'contentobject', 'config', 'article', 'block', 'component'], writeJson, function (err) {
          if (!err) {
            callback(null, 'Files created');
          } else {
            callback(err, 'Error writing JSON files');
          }
        });
      },
      // function(callback) {
      //   console.log('7.1. Preparing Build files');
      //   getCourseComponents(function(err, publishComponents) {
      //     if (err) {
      //       return callback(err);
      //     }

      //     async.each(publishComponents, copyComponentFiles, function(err) {
      //       if (!err) {
      //         return callback(null, 'Component files copied');
      //       } else {
      //         callback(err);
      //       }
      //     });
      //   });
      // },
      // function (callback) {
      //   console.log('8. Running Grunt');

      //    // var grunt = false;
      //   // run grunt build if available - developers will appreciate this, but grunt
      //   // is a development dependency, so won't be available in production environments
      //   // grunt build should be unnecessary in production in any case
      //   try {
      //     // this may throw
          

      //     // load grunt configuration. could be a nicer way to do this?
      //     require(path.join(process.cwd(), TEMP_DIR, courseId, 'Gruntfile.js'))(grunt);
      //   } catch (e) {
      //     // swallow the exception
      //     // log warning
      //     console.log('failed to require grunt');
      //     grunt = false;
      //   }

      //   if (grunt) {
      //     // run grunt build
      //     grunt.tasks(['publish'], {}, function (error) {
      //       console.log(error);
      //       if (error) {
      //         console.log('grunt build failed with error. you should manually run "grunt build" from the root of your project');
      //         callback(error);
      //       }
      //       else {
      //         console.log('Grunt worked!');
      //         callback(null, 'Build created');
      //       }
      //     });
      //   } else {
      //     console.log('Grunt not found!');
      //     callback(null, 'Error occurred!');
      //     // app.restartServer();
      //   }
      // },
      function(callback) {       
        logger.log('info', '7. Zipping it all up');
        var output = fs.createWriteStream(path.join(TEMP_DIR, courseId, user._id, 'download.zip'));
        var archive = archiver('zip');

        output.on('close', function() {
          logger.log('info', 'done')
          callback(null, 'Zip file created');
        });
        archive.on('error', function(err) {
          callback(err, 'Error during zip');
        });

        archive.pipe(output);

        archive.bulk([
          { expand: true, cwd: path.join(TEMP_DIR, courseId, user._id, BUILD_DIR), src: ['**/*'] }
        ]).finalize();
      },
      // Other steps...
      function(callback) {
        // Trigger the file download
        var filename = slugify(outputJson['course'].title);
        var filePath = path.join(TEMP_DIR, courseId, user._id, 'download.zip');
        var stat = fs.statSync(filePath);

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
    ],
    // optional callback
    function(err, results){
      logger.log('info', results);
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

