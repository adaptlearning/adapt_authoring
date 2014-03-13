/**
 * Article content plugin
 */

var ContentPlugin = require('../../../lib/contentmanager').ContentPlugin,
    configuration = require('../../../lib/configuration'),
    database = require('../../../lib/database'),
    util = require('util'),
    path = require('path');

function ArticleContent () {
}

util.inherits(ArticleContent, ContentPlugin);

/**
 * implements ContentObject#getModelName
 *
 * @return {string}
 */
ArticleContent.prototype.getModelName = function () {
  return 'article';
};

/**
 * updates sort order on siblings on create or update
 *
 * @param {object} data
 * @param {next}
 */
ArticleContent.prototype.updateSiblingSortOrder = function (data, next) {
  var index = 1;
  this.iterateSiblings(data._parentId, { operators: { sort: { _sortOrder: 1 } } }, function (doc, cb) {
    if (index === data._sortOrder) {
      ++index;
    }

    if (data._id && data._id.toString() === doc._id.toString()) {
      // skip self
      return cb(null);
    }

    doc._sortOrder = index;
    doc.save(cb);
    ++index;
  },
  function (err) {
    if (err) {
      return next(err);
    }
    next(null, data);
  });
};

/**
 * Overrides base.create
 * @param {object} data
 * @param {callback} next
 */
ArticleContent.prototype.create = function (data, next) {
  var self = this;
  ContentPlugin.prototype.create.call(self, data, function (error, doc) {
    self.updateSiblingSortOrder(doc, next);
  });
};

/**
 * Overrides base.update
 * @param {object} data
 * @param {callback} next
 */
ArticleContent.prototype.update = function (search, delta, next) {
  var self = this;
  ContentPlugin.prototype.update.call(self, search, delta, function (error) {
    // in the case of update, it's easier if we defer sortOrder update until after update
    if (!delta.hasOwnProperty('_sortOrder')) {
      // _sortOrder is not changed
      return next();
    }

    self.retrieve(search, function (error, docs) {
      if (error) {
        return next(error);
      }

      docs.length && self.updateSiblingSortOrder(docs[0], next);
    });
  });
};

/**
 * Overrides base.destroy
 * @param {object} search
 * @param {callback} next
 */
ArticleContent.prototype.destroy = function (search, next) {
  var self = this;

  // need to retrieve _parentId first!
  self.retrieve(search, function (error, docs) {
    if (error) {
      return next(error);
    }

    search._parentId = docs.length && docs[0]._parentId;
    ContentPlugin.prototype.destroy.call(self, search, function (error) {
      // must delete _id!
      delete search._id;
      self.updateSiblingSortOrder(search, next);
    });
  });
};

/**
 * Module exports
 *
 */

exports = module.exports = ArticleContent;
