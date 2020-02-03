var logger = require('../../lib/logger');
var permissions = require('../../lib/permissions');
var server = module.exports = require('express')();
var usermanager = require('../../lib/usermanager');
var util = require('util');
var helpers = require('../../plugins/output/adapt/outputHelpers');

// stop any auto permissions checks
permissions.ignoreRoute(/^\/import\/?.*$/);

server.post('/importsourcecheck', function (request, response, next) {
  app.outputmanager.getOutputPlugin(app.configuration.getConfig('outputPlugin'), function (error, plugin) {
    if (error) {
      logger.log('error', error);
      return response.status(500).send({ body: error.message });
    }
    plugin.importsourcecheck(request, function (error, importData) {
      if (error) {
        logger.log('error', error);
        return response.status(500).send({ body: error.message });
      }
      return response.status(200).send(importData);
    });
  });
});

server.post('/importsource', function (request, response, next) {
  app.outputmanager.getOutputPlugin(app.configuration.getConfig('outputPlugin'), function (error, plugin) {
    if (error) {
      logger.log('error', error);
      return response.status(500).send({ body: error.message });
    }
    plugin.importsource(request, function (error) {
      if (!error) {
        logger.log('info', 'Course imported successfully');
        return response.status(200).send({ body: app.polyglot.t('app.importcoursesuccess') });
      }

      if (error instanceof helpers.PartialImportError) {
        logger.log('info', 'Partial course import:', error);
        return response.status(error.httpStatus || 500).send({
          title: app.polyglot.t('app.importcoursepartialtitle'),
          body: error.message
        });
      }

      logger.log('error', 'Unable to import course:', error);
      return response.status(error.httpStatus || 500).send({
        title: app.polyglot.t('app.importcoursefail'),
        body: error.message
      });
    });
  });
});


server.post('/import', function (request, response, next) {
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
