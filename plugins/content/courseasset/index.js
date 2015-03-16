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
  ['contentobject', 'block', 'component'].forEach(function (contentType) {
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

            criteria._courseId = itemForDeletion._courseId;

            switch (contentType) {
              case 'contentobject':
                criteria._contentType = itemForDeletion._type;
                criteria._contentTypeId = itemForDeletion._id;
                break;
              case 'block':   
                criteria._contentTypeParentId = itemForDeletion._id;
                criteria._contentType = 'component';
                break;
              case 'component':
                criteria._contentTypeId = itemForDeletion._id;
                criteria._contentType = 'component';
                break;
            }

            // logger.log('info', criteria.toJSON());
            db.destroy('courseasset', criteria, function (err) {
              if (err) {
                logger.log('error', err);
                return next(err);
              }

              // logger.log('info', 'CourseAsset removed');
              // logger.log('info', criteria);

              next(null, data);
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
