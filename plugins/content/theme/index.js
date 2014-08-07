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

function Theme () {
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
  BowerPlugin.prototype.initialize.call(null, {
    type: 'themetype',
    keywords: 'adapt-theme',
    packageType: 'theme',
    options: defaultOptions,
    nameList: [
      'adapt-contrib-vanilla#develop'
    ]
  });

  var app = origin();
  app.once('serverStarted', function (server) {

    // disable a theme
    // expects course ID and a theme ID
    rest.post('/theme/disable/:courseid', function (req, res, next) {
      var theme = req.body.theme;
      var courseId = req.params.courseid;

      if (!theme || 'string' !== typeof theme) {
        res.statusCode = 404;
        return res.json({ success: false, message: 'theme param should be an object id' });
      }

      // remove current theme from course
      database.getDatabase(function (err, db) {
        if (err) {
          return next(err);
        }

        // update the course config object
        db.update('config', { _courseId: courseId }, { _theme: null }, function (err) {
          if (err) {
            return next(err);
          }
          res.statusCode = 200;
          res.json({success: true});
          return res.end();
        });
      });
    });

    // enable a theme
    // expects course ID and a theme ID
    rest.post('/theme/enable/:courseid', function (req, res, next) {
      var theme = req.body.theme;
      var courseId = req.params.courseid;

      if (!theme || 'string' !== typeof theme) {
        res.statusCode = 404;
        return res.json({ success: false, message: 'theme param should be a object id' });
      }

      // add selected theme to course config
      database.getDatabase(function (err, db) {
        if (err) {
          return next(err);
        }

        // update the course config object
        db.update('config', { _courseId: courseId }, { _theme: theme }, function (err) {
          if (err) {
            return next(err);
          }
          res.statusCode = 200;
          res.json({success: true});
          return res.end();
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
