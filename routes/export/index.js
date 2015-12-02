var fs = require('fs');
var server = module.exports = require('express')();
var configuration = require('../../lib/configuration');
var Constants = require('../../lib/outputmanager').Constants;
var logger = require('../../lib/logger');
var path = require('path');
var usermanager = require('../../lib/usermanager');

server.get('/export/:tenant/:course', function (req, res, next) {
  var course = req.params.course;
  var tenant = req.params.tenant;
  var currentUser = usermanager.getCurrentUser();

  if (currentUser && (currentUser.tenant._id == tenant)) {
    var outputplugin = app.outputmanager.getOutputPlugin(configuration.getConfig('outputPlugin'), function (error, plugin){
      if (error) {
        logger.log('error', error);
        res.json({
          success: false,
          message: error.message
        });
        return res.end();
      } else {
        plugin.export(course, req, res, function (error, result) {
          if (error) {
            logger.log('error', 'Unable to export');
            return res.json({
              success: false,
              message: error.message
            });
          }

          result.success = true;
          result.message = app.polyglot.t('app.exportcoursesuccess');
          res.statusCode = 200;
          return res.json(result);
        });
      }
    });
  } else {
    res.statusCode = 401;
    return res.json({
      success: false,
      message: "Sorry, the current user doesn't have access to this course"
    });
  }
});
// TODO probably needs to be moved to download route
server.get('/export/:tenant/:course/:title/download.zip', function (req, res, next) {
  var tenantId = req.params.tenant;
  var courseId = req.params.course;
  var userId = usermanager.getCurrentUser()._id;
  var zipName = req.params.title;

  var zipDir = path.join(
    configuration.tempDir,
    configuration.getConfig('masterTenantID'),
    Constants.Folders.Framework,
    Constants.Folders.AllCourses,
    tenantId,
    courseId,
    userId,
    zipName
  );

  fs.stat(zipDir, function(err, stat) {
    if (err) {
      logger.log('error', 'Error calling fs.stat');
      logger.log('error', err);

      next(err);
    } else {
      res.writeHead(200, {
          'Content-Type': 'application/zip',
          'Content-Length': stat.size,
          'Content-disposition' : 'attachment; filename=' + zipName,
          'Pragma' : 'no-cache',
          'Expires' : '0'
      });

      var readStream = fs.createReadStream(zipDir);
      readStream.pipe(res);
    }
  });
});
