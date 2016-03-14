var configuration = require('../../lib/configuration');
var express = require('express');
var server = module.exports = express();
var origin = require('../../');
var app = origin();

server.set('views', __dirname);
server.set('view engine', 'hbs');

server.get('/', function (req, res, next) {
  var dateStamp = new Date();
  var dateStampAsString = dateStamp.toISOString().replace(/[^0-9]/g, '');
  var isProduction = configuration.getConfig('isProduction');
	var useAnalytics = configuration.getConfig('useAnalytics') || false;
  var trackingId = configuration.getConfig('trackingId') || 'UA-XXXXX-Y';
     
  res.render('index', {
  	isProduction: isProduction, 
  	dateStampAsString: dateStampAsString,
    loading: app.polyglot.t('app.loading'),
    productName: app.polyglot.t('app.productname'),
    useAnalytics: useAnalytics,
    trackingId: trackingId
  });

});