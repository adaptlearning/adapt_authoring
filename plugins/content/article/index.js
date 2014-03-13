/**
 * Article content plugin
 */

var ContentPlugin = require('../../../lib/contentmanager').ContentPlugin,
    configuration = require('../../../lib/configuration'),
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
 * Module exports
 *
 */

exports = module.exports = ArticleContent;
