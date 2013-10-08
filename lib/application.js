/**
 * Module depencies
 */

var express = require('express'),
    logger = require('./logger'),
    configuration = require('./configuration');

/**
 * Module exports
 */

exports = module.exports = createApp;

/**
 * Creates the core application
 *
 * @return (Function)
 */
function createApp() {
  var app = express();
  var serverPort = configuration.getConfig('serverPort') || 3000;
  app.listen(configuration.getConfig('serverPort'));
  logger.log('info', 'adapt-builder-core server started', { port: serverPort });
  return app;
}
