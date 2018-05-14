var logger = require('../../lib/logger');
var permissions = require('../../lib/permissions');
var server = module.exports = require('express')();
var usermanager = require('../../lib/usermanager');
var util = require('util');

// stop any auto permissions checks
permissions.ignoreRoute(/^\/import\/?.*$/);

// TODO think we should move this to plugins/output/adapt/import

server.post('/importsource', function (request, response, next) {
  // TODO permissions check
  var outputplugin = app.outputmanager.getOutputPlugin(app.configuration.getConfig('outputPlugin'), function (error, plugin) {
    if (error) {
      logger.log('error', error);
      return response.status(500).send(error.message);
    }
    plugin.importsource(request, function (error) {
      if (error) {
        logger.log('error', 'Unable to import course:', error);
        return response.status(error.httpStatus || 500).send(error.message);
      }
      logger.log('info', 'Course imported successfully');
      response.status(200).send(app.polyglot.t('app.importcoursesuccess'));
    });
  });
});


server.post('/import', function (request, response, next) {
  // TODO permissions check
  var outputplugin = app.outputmanager.getOutputPlugin(app.configuration.getConfig('outputPlugin'), function (error, plugin) {
    if (error) {
      logger.log('error', error);
      return response.status(500).send(error.message);
    }
    plugin.import(request, function (error) {
      if (error) {
        logger.log('error', 'Unable to import course:', error);
        return response.status(error.httpStatus || 500).send(error.message);
      }
      logger.log('info', 'Course imported successfully');
      response.status(200).send(app.polyglot.t('app.importcoursesuccess'));
    });
  });
});
