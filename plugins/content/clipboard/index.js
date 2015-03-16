// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
/**
 * Clipboard content plugin
 */

var ContentPlugin = require('../../../lib/contentmanager').ContentPlugin,
    configuration = require('../../../lib/configuration'),
    database = require('../../../lib/database'),
    logger = require('../../../lib/logger'),
    origin = require('../../../'),
    util = require('util'),
    path = require('path');

function ClipboardContent () {
}

util.inherits(ClipboardContent, ContentPlugin);

/**
 * overrides base implementation of hasPermission
 *
 * @param {string} action
 * @param {object} a content item
 * @param {callback} next (function (err, isAllowed))
 */
ClipboardContent.prototype.hasPermission = function (action, userId, tenantId, contentItem, next) {
  return next(null, true);
};

/**
 * implements ContentObject#getModelName
 *
 * @return {string}
 */
ClipboardContent.prototype.getModelName = function () {
  return 'clipboard';
};


/**
 * Module exports
 *
 */

exports = module.exports = ClipboardContent;
