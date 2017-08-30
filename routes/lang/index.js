var express = require('express');
var path = require('path');
var fs = require('fs');

var configuration = require('../../lib/configuration');
var Constants = require('../../lib/outputmanager').Constants;

var server = module.exports = express();

server.get('/lang/:lang', function (req, res, next) {
  var lang = req.params.lang; // ie 'en' for /lang/en
  var filename = path.join(configuration.serverRoot, Constants.Folders.Temp, 'lang', lang + '.json');
  fs.exists(filename, function(exists) {
    if(!exists) {
      return res.status(404).end();
    }
    return res.json(require(filename));
  });
});
