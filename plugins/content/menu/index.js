// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
/**
 * Menu content plugin
 *
 */
var _ = require('underscore');
var async = require('async');
var bower = require('bower');
var fs = require('fs');
var path = require('path');
var util = require('util');

var BowerPlugin = require('../bower');
var configuration = require('../../../lib/configuration');
var contentmanager = require('../../../lib/contentmanager');
var database = require('../../../lib/database');
var logger = require('../../../lib/logger');
var origin = require('../../../');
var rest = require('../../../lib/rest');
var usermanager = require('../../../lib/usermanager');

var ContentPlugin = contentmanager.ContentPlugin;
var ContentTypeError = contentmanager.errors.ContentTypeError;

var defaultOptions = require('./defaults.json');

var bowerConfig = {
  type: 'menutype',
  keywords: 'adapt-menu',
  packageType: 'menu',
  srcLocation: 'menu',
  options: defaultOptions,
  nameList: [],
  updateLegacyContent: function (newPlugin, oldPlugin, next) {
    // Not required for menus
    return next();
  }
};

function Menu () {
  this.bowerConfig = bowerConfig;
};

util.inherits(Menu, BowerPlugin);

/**
 * implements ContentObject#getModelName
 *
 * @return {string}
 */
Menu.prototype.getModelName = function () {
  return 'menu';
};

/**
 *
 * @return {string}
 */
Menu.prototype.getPluginType = function () {
  return 'menutype';
};

/**
 * Overrides base.retrieve
 *
 * @param {object} search
 * @param {object} options
 * @param {callback} next
 */
Menu.prototype.retrieve = function (search, options, next) {
  // shuffle params
  if ('function' === typeof options) {
    next = options;
    options = {};
  }

  if (!options.populate) {
    options.populate = { '_menuType': ['displayName'] };
  }

  ContentPlugin.prototype.retrieve.call(this, search, options, next);
};

/**
 * essential setup
 *
 * @api private
 */
function initialize () {
BowerPlugin.prototype.initialize.call(new Menu(), bowerConfig);

  var app = origin();
  app.once('serverStarted', function (server) {

    // enable a menu
    // expects course ID and a menu ID
    rest.post('/menu/:menuid/makeitso/:courseid', function (req, res, next) {
      var menuId = req.params.menuid;
      var courseId = req.params.courseid;

      // add selected menu to course config
      database.getDatabase(function (err, db) {
        if (err) {
          return next(err);
        }

        database.getDatabase(function(err, masterDb) {
          if (err) {
            return next(err);
          }

          // verify it's a valid menu
          masterDb.retrieve('menutype', { _id: menuId }, function (err, results) {
            if (err) {
              return next(err);
            }

            if (!results || 1 !== results.length) {
              res.statusCode = 404;
              return res.json({ success: false, message: 'menu not found' });
            }

            // update the course config object
            db.update('config', { _courseId: courseId }, { _menu: results[0].name }, function (err) {
              if (err) {
                return next(err);
              }

              // if we successfully changed the menu, we need to force a rebuild of the course
              var user = usermanager.getCurrentUser();
              var tenantId = user.tenant._id;
              if (!tenantId) {
                // log an error, but don't fail
                logger.log('error', 'failed to determine current tenant', user);
                res.statusCode = 200;
                return res.json({ success: true });
              }


              app.emit('rebuildCourse', tenantId, courseId);

              res.statusCode = 200;
              return res.json({ success: true });
            });
          });
        }, configuration.getConfig('dbName'));
      });
    });
  });
};

// setup extensions
initialize();

/**
 * Module exports
 *
 */

exports = module.exports = Menu;
