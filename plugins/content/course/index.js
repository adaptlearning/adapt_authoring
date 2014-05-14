/**
 * Course Content plugin type
 */

var ContentPlugin = require('../../../lib/contentmanager').ContentPlugin,
    configuration = require('../../../lib/configuration'),
    util = require('util'),
    path = require('path'),
    async = require('async');

function CourseContent () {
}

util.inherits(CourseContent, ContentPlugin);

/**
 * implements ContentObject#getModelName
 *
 * @return {string}
 */
CourseContent.prototype.getModelName = function () {
  return 'course';
};

/**
 * implements ContentObject#getChildType
 *
 * @return {string}
 */
CourseContent.prototype.getChildType = function () {
  return 'contentobject';
};

/**
 * Overrides base.destroy
 * @param {object} search
 * @param {callback} next
 */
CourseContent.prototype.destroy = function (search, next) {
  var self = this;

  // to cascade deletes, we need the _id, which may not be in the search param
  self.retrieve(search, function (error, docs) {
    if (error) {
      return next(error);
    }

    // courses use cascading delete
    if (docs && docs.length) {
      async.eachSeries(
        docs,
        function (doc, cb) {
          self.destroyChildren(doc._id, function (error) {
            if (error) {
              return cb(error);
            }

            ContentPlugin.prototype.destroy.call(self, {_id:doc._id}, cb);
          });
        },
        next);
    } else {
      next(null);
    }
  });
};

/**
 * Module exports
 *
 */

exports = module.exports = CourseContent;
