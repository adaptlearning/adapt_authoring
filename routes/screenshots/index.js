var express = require('express');
var path = require('path');
var server = module.exports = express();
var usermanager = require('../../lib/usermanager');
var configuration =  require('../../lib/configuration');

server.set('views', __dirname);
server.set('view engine', 'hbs');

server.get('/screenshots/:tenant/:course/*', function (req, res, next) {
  var course = req.params.course,
      tenant = req.params.tenant,
      file = req.params[0],
      requestedFile = path.join(configuration.serverRoot, 'temp', tenant, 'adapt_framework', course, 'screenshots', file);
      

  res.sendfile(requestedFile);

});
