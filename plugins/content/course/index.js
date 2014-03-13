/**
 * Course Content plugin type
 */

var ContentPlugin = require('../../../lib/contentmanager').ContentPlugin,
    configuration = require('../../../lib/configuration'),
    util = require('util'),
    path = require('path');

function CourseContent () {
}

util.inherits(CourseContent, ContentPlugin);

/**
 * implements ContentObject#getModelName
 *
 * @return {string}
 */
CourseContent.prototype.getModelName = function () {
  return 'course';
};

/**
 * Module exports
 *
 */

exports = module.exports = CourseContent;
