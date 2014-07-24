var express = require('express');
var path = require('path');
var server = module.exports = express();
var usermanager = require('../../lib/usermanager');

server.set('views', __dirname);
server.set('view engine', 'hbs');

server.get('/preview/:course/:user/*', function (req, res, next) {
  var course = req.params.course,
      user = req.params.user,
      currentUser = usermanager.getCurrentUser(),
      file = req.params[0] || 'main.html',
      requestedFile = path.join(process.cwd(), 'temp', currentUser.tenant._id, 'adapt_framework', course, 'build', file);
      
  if (user == currentUser._id) {
    res.sendfile(requestedFile);
  } else {
    // User doesn't have access to this course
    res.statusCode = 500;
    res.json({success: false});
    return res.end();
  }
});
