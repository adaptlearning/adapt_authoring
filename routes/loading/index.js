var configuration = require('../../lib/configuration');
var express = require('express');
var server = module.exports = express();
var origin = require('../../');
var app = origin();

server.set('views', __dirname);
server.set('view engine', 'hbs');

server.get('/loading', function (req, res, next) {
  var dateStamp = new Date();
  var isProduction = configuration.getConfig('isProduction');
  var useAnalytics = configuration.getConfig('useAnalytics') || false;
  var trackingId = configuration.getConfig('trackingId') || 'UA-XXXXX-Y';

  res.render('loading', {
    productName: app.polyglot.t('app.productname'),
    useAnalytics: useAnalytics,
    trackingId: trackingId
  });

});