// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
/**
 * This module provides a framework for adding rest services
 */

// initialized is false until the serverStarted event is emitted, since
// the addition of routes must be deferred until after this has happened
var _initialized = false;

// tracks routes that have been added
var _routeQueue = {
  "put"     : [],
  "get"     : [],
  "post"    : [],
  "delete"  : []
};

/*
 * CONSTANTS
 */
var MODNAME = 'rest';

/**
 * all routes are filtered through this function to try and
 * shield non-rest routes from collisions
 *
 * @param {string} route
 */

function applyRouteFilter(route) {
  // route is prefixed
  return "/api" + route;
}

exports = module.exports = {

  app: {},

  /**
   * preload function
   *
   * @param {object} app - Origin instance
   */

  "init": function (app) {
    app.rest = this;
    this.app = app;
    app.once('serverStarted', function (server) {
      return app.rest.processRouteQueue(server);
    });
  },

  /**
   * This method is called just after the server is started and process
   * routes that were added beforehand so that they don't bypass the middleware
   * setup
   *
   * @param {object} server - express instance
   */

  "processRouteQueue": function (server) {
    _initialized = true;

    // iterate over the routeQueue and process routes for each HTTP method
    // for which routes have been added - this is really just resending the
    // arguments that we were previously unable to process
    var that = this;
    ["put", "get", "post", "delete"].forEach(function (methodName, methodIndex, methodArray){
      _routeQueue[methodName].forEach(function (routeEl, routeIndex, routeArray) {
        that[methodName](routeEl.route, routeEl.handler);
      });
    });
  },

  /**
   * adds a PUT (create) service
   *
   * @param {string} route - the route for this service
   * @param {function} handler - the handler function
   */

  "put": function (route, handler) {
    if (!_initialized) {
      _routeQueue["put"].push({ "route": route, "handler": handler });
      return;
    }

    this.app.put(applyRouteFilter(route), handler);
    // put and patch
    this.app.patch(applyRouteFilter(route), handler);
  },

  "patch": this.put,

  /**
   * adds a GET (read) service
   *
   * @param {string} route - the route for this service
   * @param {function} handler - the handler function
   */

  "get": function (route, handler) {
    if (!_initialized) {
      _routeQueue["get"].push({ "route": route, "handler": handler });
      return;
    }

    this.app.get(applyRouteFilter(route), function (req, res, next) {
      if (!route.startsWith('/asset/serve') && !route.startsWith('/asset/thumb')) {
        // force un-cached results
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
      handler(req, res, next);
    });  
    
  },

  /**
   * adds a POST (update) service
   *
   * @param {string} route - the route for this service
   * @param {function} handler - the handler function
   */

  "post": function (route, handler) {
    if (!_initialized) {
      _routeQueue["post"].push({ "route": route, "handler": handler });
      return;
    }

    this.app.post(applyRouteFilter(route), handler);
  },

  /**
   * adds a DELETE (delete) service
   *
   * @param {string} route - the route for this service
   * @param {function} handler - the handler function
   */

  "delete": function (route, handler) {
    if (!_initialized) {
      _routeQueue["delete"].push({ "route": route, "handler": handler });
      return;
    }

    this.app.delete(applyRouteFilter(route), handler);
  }

};
