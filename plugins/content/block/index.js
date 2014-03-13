/**
 * Block content plugin
 */

var ContentPlugin = require('../../../lib/contentmanager').ContentPlugin,
    configuration = require('../../../lib/configuration'),
    database = require('../../../lib/database'),
    util = require('util'),
    path = require('path');

function BlockContent () {
}

util.inherits(BlockContent, ContentPlugin);

/**
 * implements ContentObject#getModelName
 *
 * @return {string}
 */
BlockContent.prototype.getModelName = function () {
  return 'block';
};

/**
 * Module exports
 *
 */

exports = module.exports = BlockContent;
