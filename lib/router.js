// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
/**
 * Module used to set up routes
 *
 * @module lib/routes
 */

var fs = require('fs');
var path = require('path');
var configuration = require('./configuration');
var _ = require('underscore');

/*
 * CONSTANTS
 */
var MODNAME = 'router';

/**
 * @constructor
 */
function Router (options) {
  this.options = {
    'path' : path.join(configuration.serverRoot, 'routes')
  };

  options && (this.options = _.extend(this.options, options));
}

Router.prototype.init = function (app) {
  var basePath = this.options.path;
  var routes = fs.readdirSync(basePath);
  var server = app.server;
  routes.forEach (function (routePath) {
    var route = require(path.join(basePath, routePath));
    server.use(route);
  });
};

function createRouter (app) {
  if (!this.router || !(this.router instanceof Router)) {
    this.router = new Router();
    app.on('serverStarted', this.router.init.bind(this.router, app));
    app.on('minimalServerStarted', this.router.init.bind(this.router, app));
  }

  return router;
}

exports = module.exports = createRouter;
