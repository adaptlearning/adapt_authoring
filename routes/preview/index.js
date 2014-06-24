var express = require('express');
var path = require('path');
var server = module.exports = express();
var AdaptOutputPlugin = require('../../plugins/output/adapt/index');
var usermanager = require('../../lib/usermanager');

server.set('views', __dirname);
server.set('view engine', 'hbs');

server.get('/preview/:course/:user/*', function (req, res, next) {
  var index = 'main.html',
      type = 'adapt',
      course = req.params.course,
      user = req.params.user,
      file = req.params[0] || index,
      serverRoot = path.normalize(path.join(__dirname, '../../')),
      requestedFile = path.join(serverRoot, 'temp', course, user, 'build', file),
      loggedInUser = usermanager.getCurrentUser();

  if (user == loggedInUser._id) {
    res.sendfile(requestedFile);
  } else {
    // User doesn't have access to this course
    res.statusCode = 500;
    res.json({success: false});
    return res.end();
  }

});
