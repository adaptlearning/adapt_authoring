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

ThemePresetContent.prototype.getModelName = function() {
  return 'themepreset';
};

ThemePresetContent.prototype.updatePreset = function(presetId, courseId, res, next) {
  // save to config
  app.contentmanager.retrieve('config', { _courseId: courseId }, function(err, config) {
    if (err) return next(err);
    var delta = config[0];
    // set or delete themePreset
    if (presetId !== 'null') {
      delta._themePreset = presetId;
    } else {
      delta._themePreset = undefined;
    }
    delta._courseId = courseId;

    app.contentmanager.update('config', { _courseId: courseId }, JSON.stringify(delta), function(err) {
      if (err) return next(err);
      // lose any previously set theme settings, preset overrides
      app.contentmanager.update('course', { _id: courseId }, { _courseId: courseId, themeSettings: null }, function(err) {
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
};

function initialize() {
  var app = Origin();
  app.once('serverStarted', function(server) {
    app.rest.post('/themepreset/:presetid/makeitso/:courseid', function(req, res, next) {
      var presetId = req.params.presetid;
      var courseId = req.params.courseid;

      if (presetId === "null") {
        return new ThemePresetContent().updatePreset(presetId, courseId, res, next);
      }

      Database.getDatabase(function(err, db) {
        if (err) return next(err);

        // Verify it's a valid preset
        db.retrieve('themepreset', { _id: presetId }, function(err, results) {
          if (err) return next(err);
          if (!results || !results.length) {
            return res.status(404).json({ success: false, message: 'preset not found' });
          }
          return new ThemePresetContent().updatePreset(presetId, courseId, res, next);
        });
      });
    });

    app.rest.get('/themepreset/exists/:presetid', function(req, res, next) {
      var presetId = req.params.presetid;
      Database.getDatabase(function(err, db) {
        if (err) return next(err);

        // Verify it's a valid preset
        db.retrieve('themepreset', { _id: presetId }, function(err, results) {
          if (err) return next(err);
          if (!results || !results.length) {
              return res.status(404).json({ success:false });
          }
          return res.status(200).json({ success:true });
        });
      });
    });
  });
}

initialize();

// Module exports
exports = module.exports = ThemePresetContent;
