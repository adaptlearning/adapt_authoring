/**
 * Config content plugin
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
  logger.log('fatal', 'Config content plugin has an unmet dependency! (contentobject)');
  throw new ContentTypeError('Config content plugin has an unmet dependency! (contentobject)');
}

function ConfigContent () {
}

util.inherits(ConfigContent, ContentObject);

/**
 * implements ContentObject#getModelName
 *
 * @return {string}
 */
ConfigContent.prototype.getModelName = function () {
  return 'config';
};

/**
 * returns the child type for this object
 *
 * @return string
 */
ConfigContent.prototype.getChildType = function () {
  return false; // no children yet!
};

/**
 * Module exports
 *
 */

exports = module.exports = ConfigContent;
