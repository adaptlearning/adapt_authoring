var express = require('express');
var logger = require('../../lib/logger');
var server = module.exports = express();
var usermanager = require('../../lib/usermanager');
var configuration = require('../../lib/configuration');
var Constants = require('../../lib/outputmanager').Constants;
var configuration = require('../../lib/configuration');
var fs = require('fs');
var path = require('path');
var OutputPlugin = require('../../lib/outputmanager').OutputPlugin;
var util = require('util');

function DownloadOutput() {
}

util.inherits(DownloadOutput, OutputPlugin);

server.get('/download/:tenant/:course', function(req, res, next) {
  var course = req.params.course;
  var tenant = req.params.tenant;
  var currentUser = usermanager.getCurrentUser();
  var mode = this.Constants.Modes.publish;

  if (currentUser && (currentUser.tenant._id === tenant)) {

    var outputplugin = app.outputmanager.getOutputPlugin(configuration.getConfig('outputPlugin'), function (error, plugin){

      if (error) {
        logger.log('error', error);
        res.json({ success: false, message: error.message });
        return res.end();
      } else {
        plugin.publish(course, mode, req, res, function (error, result) {
          if (error) {
            logger.log('error', 'Unable to publish');
            return res.json({ success: false, message: error.message });
          }
          res.statusCode = 200;
          return res.json(result);
        });
      }

    });
  } else {
    // User doesn't have access to this course
    res.statusCode = 401;
    return res.json({success: false});
  }  
});

server.get('/download/:tenant/:course/:title/download.zip', function (req, res, next) {
  var tenantId = req.params.tenant;
  var courseId = req.params.course;
  var FRAMEWORK_ROOT_FOLDER = path.join(configuration.tempDir, configuration.getConfig('masterTenantID'), Constants.Folders.Framework);
  var downloadZipFilename = path.join(FRAMEWORK_ROOT_FOLDER, Constants.Folders.AllCourses, tenantId, courseId, Constants.Filenames.Download);
  var zipName = req.params.title;
  var currentUser = usermanager.getCurrentUser();

  if (currentUser && (currentUser.tenant._id == tenantId)) {
    fs.stat(downloadZipFilename, function(err, stat) {
      if (err) {
        logger.log('error', 'Error calling fs.stat');
        logger.log('error', err);

        next(err);
      } else {
        res.writeHead(200, {
            'Content-Type': 'application/zip',
            'Content-Length': stat.size,
            'Content-disposition' : 'attachment; filename=' + zipName + '.zip',
            'Pragma' : 'no-cache',
            'Expires' : '0'
        });

        var readStream = fs.createReadStream(downloadZipFilename);

        readStream.pipe(res);
      }
    });
  } else {
    // User does not have access to this download.
    res.statusCode = 401;
    return res.json({success: false});
  }
});
