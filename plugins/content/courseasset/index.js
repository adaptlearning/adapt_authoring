// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
/**
 * Clipboard content plugin
 */

var ContentPlugin = require('../../../lib/contentmanager').ContentPlugin,
    configuration = require('../../../lib/configuration'),
    database = require('../../../lib/database'),
    util = require('util'),
    origin = require('../../../'),
    logger = require('../../../lib/logger'),
    async = require('async'),
    _ = require('underscore'),
    path = require('path');

function CourseAssetContent () {
}

util.inherits(CourseAssetContent, ContentPlugin);

/**
 * overrides base implementation of hasPermission
 *
 * @param {string} action
 * @param {object} a content item
 * @param {callback} next (function (err, isAllowed))
 */
CourseAssetContent.prototype.hasPermission = function (action, userId, tenantId, contentItem, next) {
  // @TODO - check this is ok
  return next(null, true);
};

/**
 * implements ContentObject#getModelName
 *
 * @return {string}
 */
CourseAssetContent.prototype.getModelName = function () {
  return 'courseasset';
};

function initialize() {
  // Content Hook for updatedAt and updatedBy:
  ['course', 'contentobject', 'article', 'block', 'component'].forEach(function (contentType) {
    app.contentmanager.addContentHook('destroy', contentType, { when: 'pre' }, function (contentType, data, next) {
      database.getDatabase(function (err, db) {
        db.retrieve(contentType, data[0], function(err, items) {
          if (err) {
            logger.log('err', err);
            return next(err);
          }
          if (items && items.length == 1) {
            var itemForDeletion = items[0].toObject();
            var criteria = {};

            async.series([
              function(callback){
                if (contentType !== 'contentobject') {
                  return callback(null, 'Not processing a content object');
                }
                db.retrieve('article', { _courseId: itemForDeletion._courseId, _parentId: itemForDeletion._id }, function(err, articles) {
                  if (err) {
                    return callback(err, 'Unable to retrieve child articles of contentobject ' + itemForDeletion._id);
                  }
                  var parentIds = [];
                  if (articles && articles.length !== 0) {
                    criteria._courseId = itemForDeletion._courseId;
                    parentIds = _.pluck(articles, '_id');
                    // add the contentObject id as parent for assets on articles
                    parentIds.push(itemForDeletion._id);
                  }
                  async.each(articles, function(article, cb) {
                    db.retrieve('block', {_courseId: article._courseId, _parentId: article._id}, function(err, blocks) {
                      if (err) {
                        return callback(err, 'Unable to retrieve child blocks of article ' + article._id);
                      }
                      if (blocks && blocks.length !== 0) {
                        parentIds = parentIds.concat(_.pluck(blocks, '_id'));
                      }
                      if(parentIds.length > 0) {
                        criteria.$or = [
                          { _contentTypeParentId: { $in: parentIds } },
                          { _contentTypeId: itemForDeletion._id }
                        ];
                      } else {
                        criteria._contentTypeId = itemForDeletion._id;
                      }
                      cb();
                    });
                  }, function(error) {
                    if (error) {
                      callback(error);
                    } else {
                      callback(null, 'Child content objects added to criteria object');
                    }
                  });
                });
              },
              function(callback){
                if (contentType !== 'article') {
                  return callback(null, 'Not processing an article');
                }
                // When processing an article we need to retrieve the blocks in order to remove the associated assets.
                db.retrieve('block', {_courseId: itemForDeletion._courseId, _parentId: itemForDeletion._id}, function(err, blocks) {
                  if (err) {
                    return callback(err, 'Unable to retrieve child blocks of article ' + itemForDeletion._id);
                  }
                  // Formulate the block search criteria.
                  if (blocks && blocks.length !== 0) {
                    criteria._courseId = itemForDeletion._courseId;
                    // find any assets associated with the blocks as parent
                    var parentArray = _.pluck(blocks, '_id');

                    parentArray.push(itemForDeletion._id);
                    criteria.$or = [
                      { _contentTypeParentId: { $in: parentArray } },
                      { _contentTypeId: itemForDeletion._id }
                    ];
                  }
                  callback(null, 'Blocks added to criteria object');
                });
              },
              function(callback){
                // Build the search criteria for the delete.
                switch (contentType) {
                  // NOTE: 'article' is a special case -- see code above.
                  case 'course':
                    criteria._courseId = itemForDeletion._id;
                    break;
                  case 'block':
                    criteria._courseId = itemForDeletion._courseId;
                    // Find assets directly associated with the block or with block as parent
                    criteria.$or = [
                      { _contentTypeId: itemForDeletion._id },
                      { _contentTypeParentId: itemForDeletion._id }
                    ]
                    break;
                  case 'component':
                    criteria._courseId = itemForDeletion._courseId;
                    criteria._contentTypeId = itemForDeletion._id;
                    criteria._contentType = 'component';
                    break;
                }
                callback(null, 'Search criteria successfully set up');
              }
            ],
            // Callback to here
            function(err, results){
              if (err) {
                logger.log('error', err);
                return next(err);
              }
              // Only remove the courseasset if there is enough critera to search on.
              if (Object.keys(criteria).length !== 0) {
                db.destroy('courseasset', criteria, function (err) {
                  if (err) {
                    logger.log('error', err);
                    return next(err);
                  }
                  next(null, data);
                });
              } else {
                // There is not enough criteria to delete assets.
                // (This is most likely because an article with no block was removed).
                next(null, data);
              }
            });
          } else {
            logger.log('info', 'Unexpected number of ' + contentType + ' items found in courseasset pre-delete hook');
            next(null, data);
          }
        });
      });
    }.bind(null, contentType));
  });
}

initialize();

/**
 * Module exports
 *
 */

exports = module.exports = CourseAssetContent;
