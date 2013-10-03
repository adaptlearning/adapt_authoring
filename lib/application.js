/**
 * Module depencies
 */

var express = require('express'),
    configuration = require('./configuration');

/**
 * Module exports
 */

exports = module.exports = createApp;

/**
 * Creates the core application
 *
 * @return (Function)
 * @api public
 */
function createApp() {
  var app = express();
  app.listen(configuration.getConfig('serverPort'));
  return app;
}
