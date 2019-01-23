const configuration = require('../../lib/configuration');
const express = require('express');
const server = module.exports = express();
const origin = require('../../');
const app = origin();
const installHelper = require('../../lib/installHelpers');
const logger = require('../../lib/logger');

let _versions = {};

server.set('views', __dirname);
server.set('view engine', 'hbs');

server.get('/', async function (req, res, next) {
  const dateStamp = new Date();
  const dateStampAsString = dateStamp.toISOString().replace(/[^0-9]/g, '');
  const isProduction = configuration.getConfig('isProduction');
  const useAnalytics = configuration.getConfig('useAnalytics') || false;
  const trackingId = configuration.getConfig('trackingId') || 'UA-XXXXX-Y';
  const versions = await getVersions();

  res.render('index', Object.assign({
    isProduction: isProduction,
    dateStampAsString: dateStampAsString,
    loading: app.polyglot.t('app.loading'),
    productName: app.polyglot.t('app.productname'),
    useAnalytics: useAnalytics,
    trackingId: trackingId
  }, versions));
});

async function getVersions() {
  if (Object.keys(_versions).length) return _versions;

  installHelper.getInstalledVersions((error, data) => {
    if (error) {
      logger.log('error', error);
    }
    _versions = data;
    return _versions;
  });
}
