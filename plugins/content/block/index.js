// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
/**
 * Block content plugin
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
  logger.log('fatal', 'Block content plugin has an unmet dependency! (contentobject)');
  throw new ContentTypeError('Block content plugin has an unmet dependency! (contentobject)');
}

function BlockContent () {
}

util.inherits(BlockContent, ContentObject);

/**
 * implements ContentObject#getModelName
 *
 * @return {string}
 */
BlockContent.prototype.getModelName = function () {
  return 'block';
};

/**
 * returns the child type for this object
 *
 * @return string
 */
BlockContent.prototype.getChildType = function () {
  return 'component'; 
};

/**
 * Module exports
 *
 */

exports = module.exports = BlockContent;
