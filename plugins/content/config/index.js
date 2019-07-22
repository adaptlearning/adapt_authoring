// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
/**
 * Config content plugin
 */

var ContentPlugin = require('../../../lib/contentmanager').ContentPlugin,
    configuration = require('../../../lib/configuration'),
    usermanager = require('../../../lib/usermanager'),
    permissions = require('../../../lib/permissions'),
    database = require('../../../lib/database'),
    helpers = require('../../../lib/helpers'),
    logger = require('../../../lib/logger'),
    usermanager = require('../../../lib/usermanager'),
    origin = require('../../../'),
    util = require('util'),
    path = require('path'),
    _ = require('underscore'),
    async = require('async');

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
      contentItem = JSON.parse(contentItem);
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
        _defaultDirection: 'ltr',
        _drawer : {
          _showEasing : "easeOutQuart",
          _hideEasing : "easeInQuart",
          _duration : 400
        },
        _accessibility : {
          _isEnabled : false,
          _shouldSupportLegacyBrowsers : true,
          _isTextProcessorEnabled: false
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

    app.contentmanager.addContentHook('update', 'config', { when: 'pre' }, function (data, next) {
      if (data[1].hasOwnProperty('_generateSourcemap')) {
        var tenant = usermanager.getCurrentUser().tenant._id;
        var course = data[1]._courseId;
        
        app.emit('rebuildCourse', tenant, course);
      }

      next(null, data);
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

  var modelName = this.getModelName();
  
  // must have a model name
  if (!modelName) {
    return next(new ContentTypeError('this.getModelName() must be set!'));
  }

  // we retrieve based on courseId, rather than config _id
  if (search._id) {
    search._courseId = search._id;
    delete search._id;
  } else if (search._configId) { // allow override to search on configId instead
    search._id = search._configId;
  }

  ContentPlugin.prototype.retrieve.call(this, search, options, function(err, records) {
    if (err) {
      return next(err);
    }
    
    if (!records || records.length == 0) {
      return next(new Error(`Unable to retrieve ${modelName} for ${JSON.stringify(search)}`));
    }

    return next(null, [records[0]]);
  });
};

// adds content hooks etc.
initialize();

/**
 * Module exports
 *
 */

exports = module.exports = ConfigContent;
