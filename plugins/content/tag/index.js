/**
 * Tagging plugin
 */

var contentmanager = require('../../../lib/contentmanager'),
    ContentPlugin = contentmanager.ContentPlugin,
    ContentTypeError = contentmanager.errors.ContentTypeError,
    configuration = require('../../../lib/configuration'),
    database = require('../../../lib/database'),
    util = require('util'),
    path = require('path');

function TagContent () {
}

util.inherits(TagContent, ContentPlugin);

/**
 * implements TagContent#getModelName
 *
 * @return {string}
 */
TagContent.prototype.getModelName = function () {
  return 'tag';
};

/**
 * returns the child type for this object
 *
 * @return string
 */
TagContent.prototype.getChildType = function () {
  return false;
};

/**
 * Module exports
 *
 */

exports = module.exports = TagContent;
