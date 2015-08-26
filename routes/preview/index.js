var express = require('express');
var path = require('path');
var fs = require('fs');
var server = module.exports = express();
var configuration = require('../../lib/configuration');
var Constants = require('../../lib/outputmanager').Constants;
var usermanager = require('../../lib/usermanager');

server.set('views', __dirname);
server.set('view engine', 'hbs');

server.get('/preview/:tenant/:course/*', function (req, res, next) {
  var course = req.params.course,
      tenant = req.params.tenant,
      currentUser = usermanager.getCurrentUser(),
      file = req.params[0] || 'main.html',
      requestedFile = path.join(configuration.serverRoot, Constants.Folders.Temp, configuration.getConfig('masterTenantID'), Constants.Folders.Framework, Constants.Folders.AllCourses, tenant, course, Constants.Folders.Build, file);
  var currentUrl = 'http://' + configuration.serverName  + ':' + configuration.serverPort + '/preview/' + tenant + '/' + course;

  // TODO -- Cimplement security here
  fs.exists(requestedFile, function (exists) {
    if (!exists) {
      // preview may have been removed by tenant config changes
      return res.render('message', { url: currentUrl, title: "Generating preview...", message: "Your preview is taking some time to generate.  Please wait..." });
    }

    var isServerRequest = true;
    if (isServerRequest || (currentUser && (currentUser.tenant._id == tenant))) {
      res.sendFile(requestedFile);
    } else {
      // User doesn't have access to this course
      res.statusCode = 500;
      res.json({success: false});
      return res.end();
    }
  });
});
