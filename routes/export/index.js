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
        res.statusCode = 500;
        return res.json({
          success: false,
          message: error.message
        });
      } else {
        plugin.export(course, req, res, function (error, result) {
          if (error) {
            logger.log('error', 'Unable to export:', error);
            res.statusCode = 500;
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
      message: app.polyglot.t('app.errorusernoaccess')
    });
  }
});
// TODO probably needs to be moved to download route
server.get('/export/:tenant/:course/:title/download.zip', function (req, res, next) {
  var tenantId = req.params.tenant;
  var courseId = req.params.course;
  var userId = usermanager.getCurrentUser()._id;
  var zipName = req.params.title;
  // TODO don't like having to specify this here AND in plugins/output/adapt.export->getCourseName()-exportDir
  var zipDir = path.join(
    configuration.tempDir,
    configuration.getConfig('masterTenantID'),
    Constants.Folders.Framework,
    Constants.Folders.Exports,
    zipName
  );

  fs.stat(zipDir, function(err, stat) {
    if (err) {
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
