/**
 * ContentObject plugin type
 */

var ContentPlugin = require('../../../lib/contentmanager').ContentPlugin,
    configuration = require('../../../lib/configuration'),
    util = require('util'),
    path = require('path'),
    async = require('async');

function ContentObject () {
}

util.inherits(ContentObject, ContentPlugin);

/**
 * implements ContentObject#getModelName
 *
 * @return {string}
 */
ContentObject.prototype.getModelName = function () {
  return 'contentobject';
};

/**
 * updates sort order on siblings on create or update
 *
 * @param {object} data
 * @param {next}
 */
ContentObject.prototype.updateSiblingSortOrder = function (data, next) {
  if (!data) {
    return next(null);
  }
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
 * get's the maximum sort order between siblings
 *
 * @param {objectid} parentId
 * @param {callback} cb
 */
ContentObject.prototype.getMaxSortOrder = function (parentId, cb) {
  var sortOrder = 0;
  this.iterateSiblings(
    parentId,
    { operators: { sort: { _sortOrder: -1 }, limit: 1 } },
    function (doc, cb) {
      sortOrder = doc._sortOrder || sortOrder;
      cb();
    },
    function (err) {
      if (err) {
        return cb(err);
      }

      return cb(null, sortOrder);
  });
};

/**
 * returns the child type for this object
 *
 * @return string
 */
ContentObject.prototype.getChildType = function () {
  return ['article', 'contentobject'];
};

/**
 * Overrides base.create
 * @param {object} data
 * @param {callback} next
 */
ContentObject.prototype.create = function (data, next) {
  var self = this;

  // _sortOrder defaults to max of sibling sort order on insert, thereby appending
  if (!data._sortOrder) {
    return this.getMaxSortOrder(data._parentId, function (error, max) {
      if (error) {
        return error;
      }

      data._sortOrder = max+1;
      return self.create(data, next);
    });
    // you shall not pass
  }

  ContentPlugin.prototype.create.call(self, data, function (error, doc) {
    self.updateSiblingSortOrder(doc, next);
  });
};

/**
 * Overrides base.retrieve
 *
 * @param {object} search
 * @param {object} options
 * @param {callback} next
 */
ContentObject.prototype.retrieve = function (search, options, next) {
  // shuffle params
  if ('function' === typeof options) {
    next = options;
    options = {};
  }

  // must have a model name
  if (!this.getModelName()) {
    return next(new ContentTypeError('this.getModelName() must be set!'));
  }

  // Default sort by sortOrder asc
  if (!options.operators) {
    options.operators = {};
  }

  if (!options.operators.sort) {
    options.operators.sort = { '_sortOrder': 1 };
  }

  ContentPlugin.prototype.retrieve.call(this, search, options, next);
};

/**
 * Overrides base.update
 * @param {object} data
 * @param {callback} next
 */
ContentObject.prototype.update = function (search, delta, next) {
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
ContentObject.prototype.destroy = function (search, next) {
  var self = this;

  // for sortOrder update we need to retrieve _parentId first!
  self.retrieve(search, function (error, docs) {
    if (error) {
      return next(error);
    }

    // contentobjects use cascading delete
    if (docs && docs.length) {
      async.eachSeries(
      docs,
      function (doc, cb) {
        self.destroyChildren(doc._id, function (error) {
          if (error) {
            return cb(error);
          }

          // then destroy self an update sibling sort order
          ContentPlugin.prototype.destroy.call(self, {_id: doc._id}, function (error) {
            // if we're retrieving and deleting a bunch of siblings, updating the sort order each
            // time might be redundant.
            self.updateSiblingSortOrder({_parentId:doc._parentId, _sortOrder:doc._sortOrder}, cb);
          });
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

exports = module.exports = ContentObject;
