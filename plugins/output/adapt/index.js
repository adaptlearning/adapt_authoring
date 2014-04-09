/**
 * Adapt Output plugin
 */

var OutputPlugin = require('../../../lib/outputmanager').OutputPlugin,
    configuration = require('../../../lib/configuration'),
    database = require('../../../lib/database'),
    util = require('util'),
    path = require('path'),
    async = require('async');

function AdaptOutput () {
}

util.inherits(AdaptOutput, OutputPlugin);

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
  res.send('@TODO publish a course!');
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

