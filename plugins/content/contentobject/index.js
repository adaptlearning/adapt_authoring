/**
 * ContentObject plugin type
 */

var ContentPlugin = require('../../../lib/contentmanager').ContentPlugin,
    configuration = require('../../../lib/configuration'),
    util = require('util'),
    path = require('path');

function ContentObject () {
}

util.inherits(ContentObject, ContentPlugin);

/**
 * implements ContentObject#getModelName
 *
 * @return {string}
 */
ContentObject.prototype.getModelName = function () {
  return 'contentobject';
};

/**
 * Module exports
 *
 */

exports = module.exports = ContentObject;
