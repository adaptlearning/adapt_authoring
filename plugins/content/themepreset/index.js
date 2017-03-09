// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
var ContentPlugin = require('../../../lib/contentmanager').ContentPlugin;
var Configuration = require('../../../lib/configuration');
var Database = require('../../../lib/database');
var Origin = require('../../../lib/application');
var Usermanager = require('../../../lib/usermanager');
var Util = require('util');

function ThemePresetContent () {
}
Util.inherits(ThemePresetContent, ContentPlugin);

ThemePresetContent.prototype.hasPermission = function (action, userId, tenantId, contentItem, next) {
  return next(null, true);
};

ThemePresetContent.prototype.getModelName = function () {
  return 'themepreset';
};

function initialize () {
  var app = Origin();
  app.once('serverStarted', function (server) {
    // assign preset
    app.rest.post('/themepreset/:presetid/makeitso/:courseid', function (req, res, next) {
      var presetId = req.params.presetid;
      var courseId = req.params.courseid;

      Database.getDatabase(function (err, db) {
        if (err) return next(err);

        // Verify it's a valid preset
        db.retrieve('themepreset', { _id: presetId }, function (err, results) {
          if (err) return next(err);
          if (!results || 1 !== results.length) {
            return res.status(404).json({ success: false, message: 'preset not found' });
          }
          // save to config
          // TODO permissions error here
          app.contentmanager.retrieve('config', { _courseId: courseId }, function (err, results) {
            if(err) return next(err);
            // HACK requires _courseId for permissions
            app.contentmanager.update('config', { _courseId: courseId }, { _courseId: courseId, _themepreset: presetId }, function (err) {
              if (err) return next(err);
              // lose any previously set theme settings, preset overrides
              // HACK requires _courseId for permissions
              app.contentmanager.update('course', { _id: courseId }, { _courseId: courseId, themeSettings: null }, function (err) {
                if (err) return next(err);
                // force a rebuild of the course
                var tenantId = Usermanager.getCurrentUser().tenant._id;
                if (tenantId) {
                  app.emit('rebuildCourse', tenantId, courseId);
                } else {
                  // log an error, but don't fail
                  logger.log('error', 'failed to determine current tenant');
                }
                return res.status(200).json({ success: true });
              });
            });
          });
        });
      });
    });
  });
}

initialize();

// Module exports
exports = module.exports = ThemePresetContent;
