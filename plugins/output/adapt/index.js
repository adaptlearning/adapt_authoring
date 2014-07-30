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
    exec = require('child_process').exec,
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
    COURSE_DIR = 'course',
    COMPONENTS_DIR = 'components',
    ADAPT_FRAMEWORK_DIR = 'adapt_framework';

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
AdaptOutput.prototype.publish = function (courseId, isPreview, req, res, next) {
  var user = usermanager.getCurrentUser(),
    tenantId = user.tenant._id,
    outputJson = {},
    friendlyIdentifiers = {};


  // Queries the database to return each collectionType for the given courseId
  var getJson = function (collectionType, doneCallback) {

    database.getDatabase(function(err, db) {
        var criteria = collectionType == 'course' ? {_id: courseId} : {_courseId: courseId};
        var options = {
          operators : {
            sort : { _sortOrder : 1}
          }
        };

        db.retrieve(collectionType, criteria, options,
          function (error, results) {
            if (error) {
              doneCallback(error);
            }
            else if (results && results.length) {
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
    });
  };

  // Replace the database _id value with something more user-friendly
  var setupFriendlyIdentifiers = function(key, doneCallback) {
    var tags = { 'contentobject' : 'co', 'article' : 'a', 'block' : 'b', 'component' : 'c'},
      items = [];

    friendlyIdentifiers[key] = [];

    // Iterate over the given JSON and set the friendly name for the '_id'
    for (var i = 0; i < outputJson[key].length; i++) {
      // Increment the index
      var index = i + 1,
        newId = '';

      // This just sets some padding
      if (index.toString().length < 2) {
        newId = tags[key] + '-' + ('00' + index).slice(-2);
      } else {
        newId = tags[key] + '-' + index;
      }

      items.push({_id: outputJson[key][i]._id.toString(), identifier: newId});
    }

    // Write back the friendlyIdentifiers
    friendlyIdentifiers[key] = items;

    doneCallback(null);
  };

  // Writes Adapt Framework JSON files to the /course folder
  var writeJson = function(key, doneCallback) {
    var data = JSON.stringify(outputJson[key], undefined, 2),
      filepath = path.join(TEMP_DIR, tenantId, ADAPT_FRAMEWORK_DIR, courseId, BUILD_DIR, COURSE_DIR),
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
      destinationFolder = path.join(configuration.serverRoot, TEMP_DIR, courseId, user._id, SOURCE_DIR, COMPONENTS_DIR, component.name);

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
    });
  };

  // Get the JSON asynchronously
  async.each(['course', 'config', 'contentobject', 'article', 'block', 'component'], getJson, function (err) {

    // Call the steps to publish
    async.series([
      // Replace the daabase _id properties on the objects with something more user-friendly
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

        fs.exists(path.join(TEMP_DIR, tenantId, ADAPT_FRAMEWORK_DIR), function(exists) {
            if (exists) {
                // Do something
                callback(null, 'Temporary folder OK');
            } else {
              callback('Error');
              // fs.mkdir(TEMP_DIR, '0777', function(err) {
              //   if (err) {
              //     callback(err, 'Unable to make temporary folder');
              //   } else {
              //     callback(null, 'Temporary folder OK');
              //   }
              // });
            }
        });
      },
      // Create the 'src' working folder
      function(callback) {
        logger.log('info', '3. Creating/verifying working folder');

        var workingRoot = path.join(TEMP_DIR, tenantId, ADAPT_FRAMEWORK_DIR, courseId, BUILD_DIR),
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
      function(callback) {

        fs.exists(path.join(configuration.serverRoot, TEMP_DIR, tenantId, ADAPT_FRAMEWORK_DIR, courseId, BUILD_DIR, 'index.html'), function (exists) {
          if (!exists) {
            logger.log('info', '3.1. Ensuring framework build exists');

            var args = [];
            args.push('--outputdir=' + courseId);
            args.push('--theme=' + 'adapt-contrib-vanilla'); // Hard-coded theme for now
     
            child = exec('grunt server-build ' + args.toString().replace(',', ' '), {cwd: path.join(TEMP_DIR, tenantId, ADAPT_FRAMEWORK_DIR)},
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

                return;
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
      // Sanatize component data
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

      // Sanitize the IDs
      function(callback) {
        logger.log('info', '7. Sanitizing the ID values');
        var types = ['contentobject', 'article', 'block', 'component'];

        // contentobject
        for (var i = 0; i < outputJson['contentobject'].length; i++) {
          var friendlyId = _.findWhere(friendlyIdentifiers['contentobject'], {_id: outputJson['contentobject'][i]._id.toString()});
          outputJson['contentobject'][i]._id = friendlyId.identifier;

          if (outputJson['contentobject'][i]._parentId.toString() !== 'course') {
            var friendlyParentId = _.findWhere(friendlyIdentifiers['contentobject'], {_id: outputJson['contentobject'][i]._parentId.toString()});
            outputJson['contentobject'][i]._parentId = friendlyParentId.identifier;
          }
        }

        // article
        for (var i = 0; i < outputJson['article'].length; i++) {
          var friendlyId = _.findWhere(friendlyIdentifiers['article'], {_id: outputJson['article'][i]._id.toString()});
          var friendlyParentId = _.findWhere(friendlyIdentifiers['contentobject'], {_id: outputJson['article'][i]._parentId.toString()});

          outputJson['article'][i]._id = friendlyId.identifier;
          outputJson['article'][i]._parentId = friendlyParentId.identifier;
        }

        // block
        for (var i = 0; i < outputJson['block'].length; i++) {
          var friendlyId = _.findWhere(friendlyIdentifiers['block'], {_id: outputJson['block'][i]._id.toString()});
          var friendlyParentId = _.findWhere(friendlyIdentifiers['article'], {_id: outputJson['block'][i]._parentId.toString()});

          outputJson['block'][i]._id = friendlyId.identifier;
          outputJson['block'][i]._parentId = friendlyParentId.identifier;

        }

        // component
        for (var i = 0; i < outputJson['component'].length; i++) {
          var friendlyId = _.findWhere(friendlyIdentifiers['component'], {_id: outputJson['component'][i]._id.toString()});
          var friendlyParentId = _.findWhere(friendlyIdentifiers['block'], {_id: outputJson['component'][i]._parentId.toString()});

          outputJson['component'][i]._id = friendlyId.identifier;
          outputJson['component'][i]._parentId = friendlyParentId.identifier;
        }

        callback(null, 'IDs changed');
      },

      // Save the files here
      function(callback) {
        logger.log('info', '8. Saving JSON files');

        logger.log(friendlyIdentifiers);

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
        }

        logger.log('info', '9. Zipping it all up');
        var output = fs.createWriteStream(path.join(TEMP_DIR, tenantId, ADAPT_FRAMEWORK_DIR, courseId, 'download.zip')),
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
          { expand: true, cwd: path.join(TEMP_DIR, tenantId, ADAPT_FRAMEWORK_DIR, courseId, BUILD_DIR), src: ['**/*'] }
        ]).finalize();
      },
      // Other steps...
      function(callback) {
        if (isPreview) {
          return callback(null, 'Preview, so no download');
        }

        // Trigger the file download
        var filename = slugify(outputJson['course'].title),
          filePath = path.join(TEMP_DIR, tenantId, ADAPT_FRAMEWORK_DIR, courseId, 'download.zip');

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
    ],
    // optional callback
    function(err, results){
      if (results) {
        logger.log('info', results);
      }

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

