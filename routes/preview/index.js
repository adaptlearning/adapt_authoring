var express = require('express');
var path = require('path');
var server = module.exports = express();
var usermanager = require('../../lib/usermanager');

server.set('views', __dirname);
server.set('view engine', 'hbs');

server.get('/preview/:tenant/:course/*', function (req, res, next) {
  var course = req.params.course,
      tenant = req.params.tenant,
      // user = req.params.user,
      // currentUser = usermanager.getCurrentUser(),
      file = req.params[0] || 'main.html',
      requestedFile = path.join(process.cwd(), 'temp', tenant, 'adapt_framework', course, 'build', file);
      
  var currentUser = usermanager.getCurrentUser();
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
