/**
 * Exposes selected server-side configurations to the client-side
 **/
var express = require('express');
var server = (module.exports = express());
var configuration = require('../../lib/configuration');
var configData;

server.get('/config/config.json', function (req, res, next) {
  if (!configData) {
    configData = configuration.getAllClientSideConfigs();
  }

  return res.json(configData);
});
