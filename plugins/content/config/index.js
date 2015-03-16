// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
/**
 * Config content plugin
 */

var ContentPlugin = require('../../../lib/contentmanager').ContentPlugin,
    configuration = require('../../../lib/configuration'),
    permissions = require('../../../lib/permissions'),
    database = require('../../../lib/database'),
    helpers = require('../../../lib/helpers'),
    logger = require('../../../lib/logger'),
    origin = require('../../../'),
    util = require('util'),
    path = require('path');

function ConfigContent () {
}

util.inherits(ConfigContent, ContentPlugin);

/**
 * overrides base implementation of hasPermission
 *
 * @param {string} action
 * @param {object} a content item
 * @param {callback} next (function (err, isAllowed))
 */
ConfigContent.prototype.hasPermission = function (action, userId, tenantId, contentItem, next) {
  helpers.hasCoursePermission(action, userId, tenantId, contentItem, function(err, isAllowed) {
    if (err) {
      return next(err);
    }

    if (!isAllowed) {
      // Check the permissions string
      var resource = permissions.buildResourceString(tenantId, '/api/content/course/' + contentItem._courseId);
      permissions.hasPermission(userId, action, resource, next);
    } else {
      return next(null, isAllowed);
    }
  });
};

/**
 * implements ContentObject#getModelName
 *
 * @return {string}
 */
ConfigContent.prototype.getModelName = function () {
  return 'config';
};

/**
 * essential setup
 *
 * @api private
 */
function initialize () {
  var app = origin();
  app.once('serverStarted', function (server) {
    var contentmanager = app.contentmanager;
    // add a hook to course creation to create a config object to accompany it
    contentmanager.addContentHook('create', 'course', { when: 'post' }, function (course, next) {
      // @TODO - use these defaults for now, but we should be getting these
      // from the model.schema for this content type
      var configObj = {
        _courseId : course._id,
        _questionWeight : 1,
        _defaultLanguage : "en",
        _drawer : {
          _showEasing : "easeOutQuart",
          _hideEasing : "easeInQuart",
          _duration : 400
        },
        _accessibility : {
          _isEnabled : true,
          _shouldSupportLegacyBrowsers : true
        },
        screenSize : {
          small : 519,
          medium : 759,
          large : 1024
        }
      };

      contentmanager.create.apply(contentmanager, ['config', configObj, function (err, results) {
        // log an error if it exists, but don't propagate it
        if (err) {
          logger.log('error', 'config hook failed on course creation: ' + err.message);
        }
        next(null, course);
      }]);
    });
  });
}

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

// adds content hooks etc.
initialize();

/**
 * Module exports
 *
 */

exports = module.exports = ConfigContent;
