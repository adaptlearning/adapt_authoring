// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
/**
 * ContentObject plugin type
 */

var contentmanager = require('../../../lib/contentmanager'),
    ContentPlugin = contentmanager.ContentPlugin,
    ContentPermissionError = contentmanager.errors.ContentPermissionError,
    configuration = require('../../../lib/configuration'),
    permissions = require('../../../lib/permissions'),
    logger = require('../../../lib/logger'),
    usermanager = require('../../../lib/usermanager'),
    util = require('util'),
    path = require('path'),
    helpers = require('../../../lib/helpers'),    
    async = require('async');

function ContentObject () {
}

util.inherits(ContentObject, ContentPlugin);

/**
 * overrides base implementation of hasPermission
 *
 * @param {string} action
 * @param {object} a content item
 * @param {callback} next (function (err, isAllowed))
 */
ContentObject.prototype.hasPermission = function (action, userId, tenantId, contentItem, next) { 

  helpers.hasCoursePermission(action, userId, tenantId, contentItem, function(err, isAllowed) {
    if (err) {
      return next(err);
    }

    if (!isAllowed) {
      // Check the permissions string
      var resource = permissions.buildResourceString(tenantId, '/api/content/course/' + contentItem._courseId);
      permissions.hasPermission(userId, action, resource, next);
    } else {
      return next(null, isAllowed);
    }
  });
};

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
    // MAJOR ERROR
    if (error) {
      logger.log('error', 'Error creating ContentObject!', error);
      return next(error);
    }
    // preserve sort order integers on pasted children
    if (Number.isInteger(data._sortOrder)) {
      return next(null, doc);
    }
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

  self.retrieve(search, function (error, docs) {
    if (error) {
      return next(error);
    }

    if (docs.length) {
      var oldParentId = docs[0]._parentId;

      // Ensure that _courseId is included
      if (docs[0]._courseId && !delta.hasOwnProperty('_courseId')) {
        delta._courseId = docs[0]._courseId;
      }

      ContentPlugin.prototype.update.call(self, search, delta, function (error) {
        // in the case of update, it's easier if we defer sortOrder update until after update
        if (error) {
          return next(error);
        }

        self.retrieve({ _id: docs[0]._id }, function (error, docs) {
            if (delta._parentId && (oldParentId != delta._parentId)) {
              self.updateSiblingSortOrder({ _parentId: oldParentId }, function (error) {
                self.updateSiblingSortOrder(docs[0], next);
              });
            } else {
              self.updateSiblingSortOrder(docs[0], next);
            }
        });
      });
    } else {
      next(null);
    }
  });
};

/**
 * Overrides base.destroy
 * @param {object} search
 * @param {callback} next
 */
ContentObject.prototype.destroy = function (search, force, next) {
  var self = this;
  var user = app.usermanager.getCurrentUser();
  var tenantId = user.tenant && user.tenant._id;

  // shuffle params
  if ('function' === typeof force) {
    next = force;
    force = false;
  }

  // for sortOrder update we need to retrieve _parentId first!
  self.retrieve(search, function (error, docs) {
    if (error) {
      return next(error);
    }

    // contentobjects use cascading delete
    if (docs && docs.length) {

      // Set the _courseId property as this is required for the hasPermission()
      search._courseId = docs[0]._courseId;

      helpers.hasCoursePermission('delete', user._id, tenantId, search, function (err, isAllowed) {
        if (err) {
          logger.log('error', err);
          return next(err);
        }

        if (!isAllowed && !force) {
          return next(new ContentPermissionError());
        }

        async.eachSeries(
          docs,
          function (doc, cb) {
            self.destroyChildren(doc._id, function (err) {
              // then destroy self and update sibling sort order
              ContentPlugin.prototype.destroy.call(self, { _id: doc._id }, true, function (error) {
                // if we're retrieving and deleting a bunch of siblings, updating the sort order each
                // time might be redundant.
                self.updateSiblingSortOrder({_parentId:doc._parentId, _sortOrder:doc._sortOrder}, cb);
              });
            });
          },
          next
        );
      });
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
