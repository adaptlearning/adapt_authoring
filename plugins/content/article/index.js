// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
/**
 * Article content plugin
 */

var contentmanager = require('../../../lib/contentmanager'),
    ContentPlugin = contentmanager.ContentPlugin,
    ContentTypeError = contentmanager.errors.ContentTypeError,
    configuration = require('../../../lib/configuration'),
    database = require('../../../lib/database'),
    util = require('util'),
    path = require('path');

// try and require our base
var ContentObject = false;
try {
  ContentObject = require('../contentobject');
} catch (error) {
  // we only catch so we can log the error :)
  logger.log('fatal', 'Article content plugin has an unmet dependency! (contentobject)');
  throw new ContentTypeError('Block content plugin has an unmet dependency! (contentobject)');
}

function ArticleContent () {
}

util.inherits(ArticleContent, ContentObject);

/**
 * implements ContentObject#getModelName
 *
 * @return {string}
 */
ArticleContent.prototype.getModelName = function () {
  return 'article';
};

/**
 * returns the child type for this object
 *
 * @return string
 */
ArticleContent.prototype.getChildType = function () {
  return 'block';
};

/**
 * Module exports
 *
 */

exports = module.exports = ArticleContent;
