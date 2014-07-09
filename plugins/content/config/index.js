/**
 * Config content plugin
 */

var ContentPlugin = require('../../../lib/contentmanager').ContentPlugin,
    configuration = require('../../../lib/configuration'),
    database = require('../../../lib/database'),
    util = require('util'),
    path = require('path');

function ConfigContent () {
}

util.inherits(ConfigContent, ContentPlugin);

/**
 * implements ContentObject#getModelName
 *
 * @return {string}
 */
ConfigContent.prototype.getModelName = function () {
  return 'config';
};

/**
 * Overrides base.retrieve
 *
 * @param {object} search
 * @param {object} options
 * @param {callback} next
 */
ConfigContent.prototype.retrieve = function (search, options, next) {
  // shuffle params
  if ('function' === typeof options) {
    next = options;
    options = {};
  }

  // must have a model name
  if (!this.getModelName()) {
    return next(new ContentTypeError('this.getModelName() must be set!'));
  }

  // we retrieve based on courseId, rather than config _id
  if (search._id) {
    search._courseId = search._id;
    delete search._id;
  } else if (search._configId) { // allow override to search on configId instead
    search._id = search._configId;
  }

  ContentPlugin.prototype.retrieve.call(this, search, options, next);
};

/**
 * Module exports
 *
 */

exports = module.exports = ConfigContent;
