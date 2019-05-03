// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
/**
 * Theme content plugin
 *
 */

const BowerPlugin = require('../bower');
const configuration = require('../../../lib/configuration');
const contentmanager = require('../../../lib/contentmanager');
const ContentPlugin = contentmanager.ContentPlugin;
const database = require('../../../lib/database');
const defaultOptions = require('./defaults.json');
const logger = require('../../../lib/logger');
const origin = require('../../../');
const rest = require('../../../lib/rest');
const usermanager = require('../../../lib/usermanager');
const util = require('util');

var bowerConfig = {
  type: 'themetype',
  keywords: 'adapt-theme',
  packageType: 'theme',
  srcLocation: 'theme',
  options: defaultOptions,
  nameList: [],
  updateLegacyContent: function (newPlugin, oldPlugin, next) {
    // Not required for themes
    return next();
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
 * overrides BowerPlugin.prototype.updatePluginType
 *
 */

Theme.prototype.updatePluginType = function (req, res, next) {
  // just a demo
  var themeId = req.params.id;
  var delta = req.body;

  database.getDatabase(function(err, db) {
    if (err) {
      return next(err);
    }

    db.retrieve('themetype', {_id: themeId}, function(err, results) {
      if (err) {
        return next(err);
      }

      if (!results || 1 !== results.length) {
        res.statusCode = 404;
        return res.json({success: false, message: 'Theme not found'});
      }

      db.update('themetype', {_id: themeId}, delta, function(err, theme) {
        if (err) {
          return next(err);
        }

        res.statusCode = 200;
        return res.json({ success: true });
      });
    });
  });
};

/**
 * essential setup
 *
 * @api private
 */
function initialize () {
  BowerPlugin.prototype.initialize.call(new Theme(), bowerConfig);

  var app = origin();
  app.once('serverStarted', function() {

    // Assign a theme to to a course
    rest.post('/theme/:themeid/makeitso/:courseid', function (req, res, next) {
      var themeId = req.params.themeid;
      var courseId = req.params.courseid;

      // add selected theme to course config
      database.getDatabase(function (err, db) {
        if (err) {
          return next(err);
        }

        db.retrieve('config', { _courseId: courseId }, function(err, results) {
          if (err) {
            return next(err);
          }

          if (!results || 1 !== results.length) {
            res.statusCode = 404;
            return res.json({ success: false, message: 'config not found' });
          } else {
            var config = results[0];

            database.getDatabase(function (err, masterDb) {
              if (err) {
                return next(err);
              }

              // Verify it's a valid theme
              masterDb.retrieve('themetype', { _id: themeId }, function (err, results) {
                if (err) {
                  return next(err);
                }

                if (!results || 1 !== results.length) {
                  res.statusCode = 404;
                  return res.json({ success: false, message: 'theme not found' });
                }

                var newThemeName = results[0].name;

                if (config._theme === newThemeName) {
                  forceRebuild();
                  return;
                }

                // Update the course config object
                app.contentmanager.update('config', { _courseId: courseId }, { _courseId: courseId, _theme: newThemeName }, function (err) {
                  if (err) {
                    return next(err);
                  }

                  // As the theme has changed, lose any previously set theme settings
                  // These will not apply to the new theme
                  app.contentmanager.update('course', { _id: courseId }, { themeSettings: null }, forceRebuild);
                });

                function forceRebuild(err) {
                  if (err) {
                    return next(err);
                  }

                  // If we successfully changed the theme, we need to force a rebuild of the course
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
                  return res.json({success: true});
                }
              });
            }, configuration.getConfig('dbName'));            
          }
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
