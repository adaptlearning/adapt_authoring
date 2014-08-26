var express = require('express');
var path = require('path');
var fs = require('fs');
var server = module.exports = express();
var usermanager = require('../../lib/usermanager');

server.set('views', __dirname);
server.set('view engine', 'hbs');

server.get('/preview/:tenant/:course/*', function (req, res, next) {
  var course = req.params.course,
      tenant = req.params.tenant,
      currentUser = usermanager.getCurrentUser(),
      file = req.params[0] || 'main.html',
      requestedFile = path.join(process.cwd(), 'temp', tenant, 'adapt_framework', 'courses', course, 'build', file);

  // TODO -- Cimplement security here
  fs.exists(requestedFile, function (exists) {
    if (!exists) {
      // preview may have been removed by tenant config changes
      return res.render('message', { title: "Preview Not Found", message: "Your preview was not found. Please close this tab and try again." });
    }

    var isServerRequest = true;
    if (isServerRequest || (currentUser && (currentUser.tenant._id == tenant))) {
      res.sendfile(requestedFile);
    } else {
      // User doesn't have access to this course
      res.statusCode = 500;
      res.json({success: false});
      return res.end();
    }
  });
});
