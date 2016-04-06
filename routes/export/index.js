var fs = require('fs');
var server = module.exports = require('express')();
var configuration = require('../../lib/configuration');
var Constants = require('../../lib/outputmanager').Constants;
var helpers = require('../../lib/helpers');
var logger = require('../../lib/logger');
var path = require('path');
var permissions = require('../../lib/permissions');
var usermanager = require('../../lib/usermanager');
var util = require('util');

function ExportPermissionError(message, httpCode) {
  this.message = message || "Permission denied";
  this.http_code = httpCode || 401;
}
util.inherits(ExportPermissionError, Error);

// stop any auto permissions checks
permissions.ignoreRoute(/^\/export\/?.*$/);

// TODO think we should move these to plugins/output/adapt/export

server.get('/export/:tenant/:course/download.zip', function (req, res, next) {
  var tenantId = req.params.tenant;
  var courseId = req.params.course;
  var userId = usermanager.getCurrentUser()._id;
  // TODO not good specifying this here AND in plugins/output/adapt/export EXPORT_DIR
  var zipDir = path.join(
    configuration.tempDir,
    configuration.getConfig('masterTenantID'),
    Constants.Folders.Framework,
    Constants.Folders.Exports,
    userId + '.zip'
  );
  // get the course name
  app.contentmanager.getContentPlugin('course', function (error, plugin) {
    if (error) return handleError(error, res);
    plugin.retrieve({ _id:courseId }, {}, function(error, results) {
      if (error) return handleError(error, res);
      if (results.length !== 1) {
        return handleError(new Error('Export: cannot find course (' + courseId + ')'), res);
      }
      fs.stat(zipDir, function(error, stat) {
        if (error) return handleError(error, res);
        var zipName = helpers.slugify(results[0].title,'export') + '.zip';
        res.writeHead(200, {
            'Content-Type': 'application/zip',
            'Content-Length': stat.size,
            'Content-disposition' : 'attachment; filename=' + zipName,
            'Pragma' : 'no-cache',
            'Expires' : '0'
        });
        fs.createReadStream(zipDir).pipe(res);
      });
    });
  });
});

server.get('/export/:tenant/:course/:devMode', function (req, res, next) {
  var course = req.params.course;
  var tenant = req.params.tenant;
  var devMode = req.params.devMode;
  var currentUser = usermanager.getCurrentUser();

  helpers.hasCoursePermission('', currentUser._id, tenant, {_id: course}, function(err, hasPermission) {
    if (err || !hasPermission) {
      return handleError(err || new ExportPermissionError(), res);
    }
    if (currentUser && (currentUser.tenant._id == tenant)) {
      var outputplugin = app.outputmanager.getOutputPlugin(configuration.getConfig('outputPlugin'), function (error, plugin){
        if (error) {
          return handleError(error, res);
        } else {
          plugin.export(course, devMode, req, res, function (error, result) {
            if (error) {
              return handleError(error, res);
            }
            return res.status(200).json({
              success: true,
              message: app.polyglot.t('app.exportcoursesuccess')
            });
          });
        }
      });
    } else {
      return res.status(401).json({
        success: false,
        message: app.polyglot.t('app.errorusernoaccess')
      });
    }
  });
});

function handleError(error, res) {
  logger.log('error', error);
  res.status(500).json({
    success: false,
    message: error.message
  });
};
