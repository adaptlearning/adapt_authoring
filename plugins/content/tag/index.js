/**
 * Tagging plugin
 */

var contentmanager = require('../../../lib/contentmanager'),
    ContentPlugin = contentmanager.ContentPlugin,
    ContentTypeError = contentmanager.errors.ContentTypeError,
    configuration = require('../../../lib/configuration'),
    database = require('../../../lib/database'),
    util = require('util'),
    path = require('path');

function TagContent () {
}

util.inherits(TagContent, ContentPlugin);

/**
 * implements TagContent#getModelName
 *
 * @return {string}
 */
TagContent.prototype.getModelName = function () {
  return 'tag';
};

/**
 * returns the child type for this object
 *
 * @return string
 */
TagContent.prototype.getChildType = function () {
  return false;
};

TagContent.prototype.create = function (data, next) {
  // enforce unique tags here, rather than in schema
  var self = this;
  this.retrieve({ title: data.title }, function (err, results) {
    if (err) {
      return next(err);
    }

    // if a tag exists, just return it
    if (results && 0 !== results.length) {
      return next(null, results[0]);
    }

    // otherwise, create as usual
    ContentPlugin.prototype.create.call(self, data, next);
  });
};

function initialize () {
  app.on('serverStarted', function () {
    app.rest.get('/tags/autocomplete', function (req, res, next) {
      database.getDatabase(function (err, db) {
        if (err) {
          return next(err);
        }

        db.retrieve('tag', { _isDeleted:false }, { fields: 'title' }, function (err, results) {
          if (err) {
            return next(err);
          }

          var tags = [];
          results && results.forEach (function (item) {
            tags.push(item.title);
          });

          res.statusCode = 200;
          return res.json(tags);
        });
      });
    });
  });
}

initialize();

/**
 * Module exports
 *
 */


exports = module.exports = TagContent;
