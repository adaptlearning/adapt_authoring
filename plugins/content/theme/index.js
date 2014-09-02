/**
 * Theme content plugin
 *
 */

var origin = require('../../../'),
    contentmanager = require('../../../lib/contentmanager'),
    rest = require('../../../lib/rest'),
    BowerPlugin = require('../bower'),
    ContentPlugin = contentmanager.ContentPlugin,
    ContentTypeError = contentmanager.errors.ContentTypeError,
    configuration = require('../../../lib/configuration'),
    usermanager = require('../../../lib/usermanager'),
    database = require('../../../lib/database'),
    logger = require('../../../lib/logger'),
    defaultOptions = require('./defaults.json'),
    bower = require('bower'),
    rimraf = require('rimraf'),
    async = require('async'),
    fs = require('fs'),
    ncp = require('ncp').ncp,
    mkdirp = require('mkdirp'),
    _ = require('underscore'),
    util = require('util'),
    path = require('path');

var bowerConfig = {
  type: 'themetype',
  keywords: 'adapt-theme',
  packageType: 'theme',
  srcLocation: 'theme',
  options: defaultOptions,
  nameList: [
    'adapt-contrib-vanilla#develop'
  ],
  updateLegacyContent: function (newPlugin, oldPlugin, next) {
    database.getDatabase(function (err, db) {
      if (err) {
        return next(err);
      }

      db.update('config', { _theme: oldPlugin._id }, { _theme: newPlugin._id }, next);
    });
  }
};

function Theme () {
  this.bowerConfig = bowerConfig;
}

util.inherits(Theme, BowerPlugin);

/**
 * implements ContentObject#getModelName
 *
 * @return {string}
 */
Theme.prototype.getModelName = function () {
  return 'theme';
};

/**
 *
 * @return {string}
 */
Theme.prototype.getPluginType = function () {
  return 'themetype';
};

/**
 * Overrides base.retrieve
 *
 * @param {object} search
 * @param {object} options
 * @param {callback} next
 */
Theme.prototype.retrieve = function (search, options, next) {
  // shuffle params
  if ('function' === typeof options) {
    next = options;
    options = {};
  }

  if (!options.populate) {
    options.populate = { '_themeType': ['displayName'] };
  }

  ContentPlugin.prototype.retrieve.call(this, search, options, next);
};

/**
 * essential setup
 *
 * @api private
 */
function initialize () {
  BowerPlugin.prototype.initialize.call(null, bowerConfig);

  var app = origin();
  app.once('serverStarted', function (server) {

    // enable a theme
    // expects course ID and a theme ID
    rest.post('/theme/:themeid/makeitso/:courseid', function (req, res, next) {
      var themeId = req.params.themeid;
      var courseId = req.params.courseid;

      // add selected theme to course config
      database.getDatabase(function (err, db) {
        if (err) {
          return next(err);
        }

        // verify it's a valid theme
        db.retrieve('themetype', { _id: themeId }, function (err, results) {
          if (err) {
            return next(err);
          }

          if (!results || 1 !== results.length) {
            res.statusCode = 404;
            return res.json({ success: false, message: 'theme not found' });
          }

          // update the course config object
          db.update('config', { _courseId: courseId }, { _theme: themeId }, function (err) {
            if (err) {
              return next(err);
            }

            // if we successfully changed the theme, we need to force a rebuild of the course
            var user = usermanager.getCurrentUser();
            var tenantId = user.tenant._id;
            if (!tenantId) {
              // log an error, but don't fail
              logger.log('error', 'failed to determine current tenant', user);
              res.statusCode = 200;
              return res.json({ success: true });
            }

            var coursePath = path.join(configuration.tempDir, tenantId, 'adapt_framework', courseId);
            rimraf(coursePath, function (err) {
              if (err) {
                // log the error, but don't fail
                logger.log('error', err.message, err);
              }

              res.statusCode = 200;
              res.json({success: true});
              return res.end();
            });
          });
        });
      });
    });
  });
}

// setup themes
initialize();

/**
 * Module exports
 *
 */

exports = module.exports = Theme;
