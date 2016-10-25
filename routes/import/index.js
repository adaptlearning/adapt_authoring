var logger = require('../../lib/logger');
var permissions = require('../../lib/permissions');
var server = module.exports = require('express')();
var usermanager = require('../../lib/usermanager');
var util = require('util');

// stop any auto permissions checks
permissions.ignoreRoute(/^\/import\/?.*$/);

// TODO think we should move this to plugins/output/adapt/import

server.post('/import', function (request, response, next) {
  var currentUser = usermanager.getCurrentUser();

  // TODO permissions check

  logger.log('info', 'Starting course import');

  var outputplugin = app.outputmanager.getOutputPlugin(configuration.getConfig('outputPlugin'), function (error, plugin) {
    if (error) {
      logger.log('error', error);
      return response.status(500).json({
        success:false,
        message: error.message
      });
    } else {
      plugin.import(request, function (error) {
        if (error) {
          logger.log('error', 'Unable to import course:', error);
          return response.status(error.httpStatus || 500).json({
            success: false,
            message: error.message
          });
        }
        logger.log('info', 'Course imported successfully');
        response.status(200).json({
          success: true,
          message: app.polyglot.t('app.importcoursesuccess')
        });
      });
    }
  });
});
