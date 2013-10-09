/**
 * Module depencies
 */

var express = require('express'),
    logger = require('./logger'),
    configuration = require('./configuration'),
    database = require('./database');

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
  // initialisation
  var app = express();
  var dbType = configuration.getConfig('dbType') || 'none';
  database.getDatabase(dbType);

  // start listening
  var serverPort = configuration.getConfig('serverPort') || 3000;
  app.listen(configuration.getConfig('serverPort'));
  logger.log('info', 'adapt-builder-core server started', { port: serverPort });
  
  return app;
}
