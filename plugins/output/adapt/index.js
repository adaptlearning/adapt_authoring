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
    archiver = require('archiver');

function AdaptOutput () {
}

util.inherits(AdaptOutput, OutputPlugin);

var TEMP_DIR = 'temp',
    BUILD_DIR = 'build';


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
              //  return res.json(transformed);
              });
              
              
            }
          }
        );     
    }, configuration.getConfig('dbName'));
  };

  var writeJson = function(key, doneCallback) {
    var data = JSON.stringify(outputJson[key]);

    fs.writeFile(TEMP_DIR + '/' + courseId + '/' + BUILD_DIR + '/' + key + 's.json', data, function (error) {
      if (error) {
        doneCallback(error);
      } else {
        doneCallback(null);
      } 
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
        fs.exists(TEMP_DIR + "/" + courseId, function(exists) {
          if (exists) {
            // Remove files?
            callback(null,  courseId + ' folder OK');
          } else {
            fs.mkdir(TEMP_DIR + "/" + courseId, '0777', function(err) {
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

        fs.exists(TEMP_DIR + "/" + courseId + '/' + BUILD_DIR, function(exists) {
          if (exists) {
            // Remove files?
            callback(null, BUILD_DIR + ' folder OK');
          } else {
            fs.mkdir(TEMP_DIR + "/" + courseId + '/' + BUILD_DIR, '0777', function(err) {
              if (err) {
                callback(err, 'Error creating '  + BUILD_DIR);
              } else {
                callback(null, BUILD_DIR + ' folder OK');
              }
            });
          }
        }); 
      },
      // Save the files here
      function(callback) {
        console.log('4. Saving JSON files');
        // TODO -- extract config
        async.each(['course', 'contentobject', 'article', 'block', 'component'], writeJson, function (err) {
          if (!err) {
            callback(null, 'Files created');
          }
        });
      },
      function(callback) {
        console.log('5. Zip it all up');

        var output = fs.createWriteStream(path.join(TEMP_DIR, courseId,'download.zip'));
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
        console.log('All done');
        // Trigger download
        var filePath = path.join(TEMP_DIR, courseId, 'download.zip');
        var stat = fs.statSync(filePath);

        res.writeHead(200, {
            'Content-Type': 'application/zip',
            'Content-Length': stat.size,
            'Content-disposition' : 'attachment; filename=download.zip',
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


  // res.setHeader('Content-disposition', 'attachment; filename=theDocument.txt');
  // res.setHeader('Content-type', 'text/plain');
  // res.charset = 'UTF-8';
  // res.write("Hello, world");
  // res.send('@TODO publish a course!');
//  return next();
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

