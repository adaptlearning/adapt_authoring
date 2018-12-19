const configuration = require('../../lib/configuration');
const express = require('express');
const server = module.exports = express();
const origin = require('../../');
const app = origin();
const installHelper = require('../../lib/installHelpers');
const logger = require('../../lib/logger');

let versions = {};

server.set('views', __dirname);
server.set('view engine', 'hbs');

server.get('/', function (req, res, next) {
  const dateStamp = new Date();
  const dateStampAsString = dateStamp.toISOString().replace(/[^0-9]/g, '');
  const isProduction = configuration.getConfig('isProduction');
  const useAnalytics = configuration.getConfig('useAnalytics') || false;
  const trackingId = configuration.getConfig('trackingId') || 'UA-XXXXX-Y';

  getVersions(function(versions) {
    res.render('index', Object.assign({
      isProduction: isProduction,
      dateStampAsString: dateStampAsString,
      loading: app.polyglot.t('app.loading'),
      productName: app.polyglot.t('app.productname'),
      useAnalytics: useAnalytics,
      trackingId: trackingId
    }, versions));
  });
});

function getVersions(cb) {
  if (Object.keys(versions).length) {
    return cb(versions);
  }

  installHelper.getInstalledVersions(function(error, data) {
    if (error) {
      logger.log('error', error);
    }
    versions = data;
    cb(versions);
  });
}
