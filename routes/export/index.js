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

server.get('/export/:tenant/:course', function (req, res, next) {
  var course = req.params.course;
  var tenant = req.params.tenant;
  var currentUser = usermanager.getCurrentUser();

  helpers.hasCoursePermission('', currentUser._id, tenant, {_id: course}, function(err, hasPermission) {
    if (err || !hasPermission) {
      return next(err || new ExportPermissionError());
    }

    if (currentUser && (currentUser.tenant._id == tenant)) {
      var outputplugin = app.outputmanager.getOutputPlugin(configuration.getConfig('outputPlugin'), function (error, plugin){
        if (error) {
          logger.log('error', error);
          res.statusCode = 500;
          return res.json({
            success: false,
            message: error.message
          });
        } else {
          plugin.export(course, req, res, function (error, result) {
            if (error) {
              logger.log('error', 'Unable to export:', error);
              return res.status(500).json({
                success: false,
                message: error.message
              });
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
// TODO probably needs to be moved to download route
server.get('/export/:tenant/:course/download.zip', function (req, res, next) {
  var tenantId = req.params.tenant;
  var courseId = req.params.course;
  var userId = usermanager.getCurrentUser()._id;
  // TODO don't like having to specify this here AND in plugins/output/adapt.export->getCourseName()-exportDir
  var zipDir = path.join(
    configuration.tempDir,
    configuration.getConfig('masterTenantID'),
    Constants.Folders.Framework,
    Constants.Folders.Exports,
    userId + '.zip'
  );
  // get the course name
  app.contentmanager.getContentPlugin('course', function (error, plugin) {
    if (error) return callback(error);
    plugin.retrieve({ _id:courseId }, {}, function(error, results) {
      if (error) {
        return callback(error);
      }
      if (results.length !== 1) {
        return callback(new Error('Export: cannot find course (' + courseId + ')'));
      }
      fs.stat(zipDir, function(error, stat) {
        if (error) {
          return next(error);
        }
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
