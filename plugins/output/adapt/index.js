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
    _ = require('underscore');

function AdaptOutput () {
}

util.inherits(AdaptOutput, OutputPlugin);

/**
 * Constants
 */
var TEMP_DIR = 'temp',
    BUILD_DIR = 'build';

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
    }, configuration.getConfig('dbName'));
  };

  var writeJson = function(key, doneCallback) {  
    var filenames = {};
    filenames['course'] = 'course.json';
    filenames['contentobject'] = 'contentObjects.json';
    filenames['article'] = 'articles.json';
    filenames['block'] = 'blocks.json';
    filenames['component'] = 'components.json';

    var data = JSON.stringify(outputJson[key], undefined, 2);

    fs.writeFile(path.join(TEMP_DIR, courseId, BUILD_DIR, filenames[key]), data, function (error) {
      if (error) {
        doneCallback(error);
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
  async.each(['course', 'contentobject', 'article', 'block', 'component'], getJson, function (err) {
    // console.log('TODO: Sanitizing JSON...');
    // console.log("Finished!");
    // console.log(outputJson);

    async.series([
      // Verify that the temporary folder exists
      function(callback) {
        console.log('1. Verifying temporary folder exists');

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
      // Create a temporary folder for ths .json files
      function(callback) {
        console.log('2. Creating/verifying course specific temp folder');
        fs.exists(path.join(TEMP_DIR, courseId), function(exists) {
          if (exists) {
            // Remove files?
            callback(null,  courseId + ' folder OK');
          } else {
            fs.mkdir(path.join(TEMP_DIR, courseId), '0777', function(err) {
              if (err) {
                callback(err, 'Error creating ' + TEMP_DIR);
              } else {
                callback(null, 'Course temp folder OK');
              }
            });
          }
        });        
      },
      function(callback) {
        console.log('3. Verifying ' + BUILD_DIR + ' folder');

        fs.exists(path.join(TEMP_DIR, courseId, BUILD_DIR), function(exists) {
          if (exists) {
            // Remove files?
            callback(null, BUILD_DIR + ' folder OK');
          } else {
            fs.mkdir(path.join(TEMP_DIR, courseId, BUILD_DIR), '0777', function(err) {
              if (err) {
                callback(err, 'Error creating '  + BUILD_DIR);
              } else {
                callback(null, BUILD_DIR + ' folder OK');
              }
            });
          }
        }); 
      },
      // Sanatize course data
      function(callback) {
        console.log('4. Sanitizing course JSON');
        var courseJson = outputJson['course'];
 
        // Don't leave it as an array
        var str = JSON.stringify(outputJson['course']);
        str = str.substring(1);
        str = str.slice(0, -1);
        courseJson = JSON.parse(str);

        // Replace the ID and type
        courseJson._id = 'course';
        courseJson._type = 'course';

        outputJson['course'] = courseJson;

        callback(null, 'course.json sanatized');
      },
      // Sanatize component data
      function(callback) {
        console.log('5. Sanitizing component JSON');
        var components = outputJson['component'];

        // The 'properties' property of a component should not be included as an 
        // attribute in the output, but all its children should
        for (var i = 0; i < components.length; i++) {
          if (components[i].hasOwnProperty('properties')) {
            for(var key in components[i].properties){
              console.log(key);
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
      // Save the files here
      function(callback) {
        console.log('6. Saving JSON files');
        // TODO -- extract config
        async.each(['course', 'contentobject', 'article', 'block', 'component'], writeJson, function (err) {
          if (!err) {
            callback(null, 'Files created');
          }
        });
      },
      function(callback) {
        console.log('7. Preparing Build files');
        getCourseComponents(function(err, publishComponents) {
          if (err) {
            return callback(err);
          }

          // @TODO: Create symlinks to components for build here?
          //publishComponents.forEach(function (component) {
            // Add symlink for this component...
          //});

          callback(null, 'Build files prepared');
        });
      },
      function(callback) {
        console.log('8. Zipping it all up');

        var output = fs.createWriteStream(path.join(TEMP_DIR, courseId, 'download.zip'));
        var archive = archiver('zip');

        output.on('close', function() {
          console.log('done')
          callback(null, 'Zip file created'); 
        });
        archive.on('error', function(err) { 
          callback(err, 'Error during zip'); 
        });

        archive.pipe(output);

        archive.bulk([
          { expand: true, cwd: path.join(TEMP_DIR, courseId, BUILD_DIR), src: ['**/*'] }
        ]).finalize();
      },
      // Other steps...
      function(callback) {
        // Trigger the file download
        var filename = slugify(outputJson['course'].title);
        var filePath = path.join(TEMP_DIR, courseId, 'download.zip');
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
      console.log(results);
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

