// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
/**
 * Tagging plugin
 */

var contentmanager = require('../../../lib/contentmanager'),
    ContentPlugin = contentmanager.ContentPlugin,
    ContentTypeError = contentmanager.errors.ContentTypeError,
    configuration = require('../../../lib/configuration'),
    permissions = require('../../../lib/permissions'),
    database = require('../../../lib/database'),
    util = require('util'),
    path = require('path');

function TagContent () {
}

util.inherits(TagContent, ContentPlugin);

/**
 * overrides base implementation of hasPermission
 *
 * @param {string} action
 * @param {object} a content item
 * @param {callback} next (function (err, isAllowed))
 */
TagContent.prototype.hasPermission = function (action, userId, tenantId, contentItem, next) {
  // @TODO - check if this is ok
  return next(null, true);
};

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

  // clean title and make case insenitive regex
  data.title = data.title.replace(/,/g, '').trim();
  var tagRegex = new RegExp('^' + escapeRegExp(data.title) + '$', "i");
  this.retrieve({ title: tagRegex }, function (err, results) {
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
    permissions.ignoreRoute(/^\/api\/autocomplete\/tag\/?$/);
    app.rest.get('/autocomplete/tag', function (req, res, next) {
      database.getDatabase(function (err, db) {
        if (err) {
          return next(err);
        }

        var searchParams;
        if (req.query.hasOwnProperty('term')){
          // create regex for "term" and ignore case
          var termRegex = new RegExp('^' + escapeRegExp(req.query.term), 'i');
          searchParams = { _isDeleted:false, title:termRegex };
        } else {
          searchParams = { _isDeleted:false };
        }


        db.retrieve('tag', searchParams, { fields: 'title' }, function (err, results) {
          if (err) {
            return next(err);
          }

          var tags = [];
          results && results.forEach (function (item) {
            tags.push({title: item.title, value: item.title, _id: item._id});
          });

          res.statusCode = 200;
          return res.json(tags);
        });
      });
    });
  });
}

/**
* escape regex
* see http://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
*/
function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}

initialize();

/**
 * Module exports
 *
 */


exports = module.exports = TagContent;
