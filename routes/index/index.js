var configuration = require('../../lib/configuration');
var express = require('express');
var server = module.exports = express();

server.set('views', __dirname);
server.set('view engine', 'hbs');

server.get('/', function (req, res, next) {
  var dateStamp = new Date();
  dateStampAsString = dateStamp.toISOString().replace(/[^0-9]/g, "");
  var isProduction = configuration.getConfig('isProduction');

  res.render('index', {
  	isProduction: isProduction, 
  	dateStampAsString: dateStampAsString
  });

});