/**
 * Clipboard content plugin
 */

var ContentPlugin = require('../../../lib/contentmanager').ContentPlugin,
    configuration = require('../../../lib/configuration'),
    database = require('../../../lib/database'),
    util = require('util'),
    path = require('path');

function ClipboardContent () {
}

util.inherits(ClipboardContent, ContentPlugin);

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
