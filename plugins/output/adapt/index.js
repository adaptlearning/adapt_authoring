/**
 * Adapt Output plugin
 */

var OutputPlugin = require('../../../lib/outputmanager').OutputPlugin,
    configuration = require('../../../lib/configuration'),
    util = require('util'),
    path = require('path'),
    database = require('../../../lib/database'),
    fs = require('fs'),
    async = require('async');

function AdaptOutput () {
}

util.inherits(AdaptOutput, OutputPlugin);

/**
 * implements OutputPlugin#preview
 *
 */
AdaptOutput.prototype.preview = function (courseId, req, res, next) {
  res.send('@TODO render a course preview! **cries**');

  return next();
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
              outputJson[collectionType] = results;
              doneCallback(null);
            }
          }
        );     
    }, configuration.getConfig('dbName'));
  };

  // Get the JSON asynchronously
  async.each(['course', 'contentobject', 'article', 'block', 'component'], getJson, function (err) {
    console.log('TODO: Sanitizing JSON...');
    console.log("Finished!");
    console.log(outputJson);

    async.series([
      // Create a temporary folder for ths .json files
      function(callback) {
        console.log('Create temporary folder');
        callback(null, 'one');
      },
      // Save the files here
      function(callback) {
        console.log('output files');
        callback(null, 'two');
      },
      // Other steps...
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
  return next();
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

