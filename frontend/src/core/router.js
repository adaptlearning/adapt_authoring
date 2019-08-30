// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var _ = require('underscore');
  var Backbone = require('backbone');
  var Origin = require('core/origin');

  var Router = Backbone.Router.extend({
    homeRoute: '',
    routes: {
      '': 'handleIndex',
      '_=_': 'handleIndex',
      ':module(/*route1)(/*route2)(/*route3)(/*route4)': 'handleRoute'
    },

    initialize: function() {
      this.listenTo(Origin, 'origin:initialize', this.onOriginInitialize);
      this.locationKeys = ['module', 'route1', 'route2', 'route3', 'route4'];
      this.resetLocation();
    },

    updateLocation: function(routeArgs) {
      // save the previous location
      Origin.previousLocation = Origin.location;

      this.evaluateDashboardRoute();

      this.resetLocation();
      _.each(this.locationKeys, function(key, index) {
        Origin.location[key] = routeArgs[index];
      });

      var mod = routeArgs[0];
      var route1 = routeArgs[1];
      $('body')
        .removeClass()
        .addClass('module-' + mod + ((route1) ? ' location-' + route1 : ''));

      Origin.trigger('location:change', Origin.location);
    },

    resetLocation: function() {
      Origin.location = {};
    },
    /**
    * Allows modules/plugins to set a custom home route
    */
    setHomeRoute: function(url) {
      this.homeRoute = url;
    },

    isUserAuthenticated: function() {
      return Origin.sessionModel.get('isAuthenticated') ? true : false;
    },

    /**
    * Checks user permissions for route
    */
    verifyRoute: function(module, route1) {
      // Check this user has permissions
      if(!Origin.permissions.checkRoute(Backbone.history.fragment)) {
        this.blockUserAccess();
        return false;
      }
      // FIXME routes shouldn't be hard-coded
      if(!this.isUserAuthenticated()  && (module !== 'user' && route1 !== 'login')) {
        this.blockUserAccess(Origin.l10n.t('app.errorsessionexpired'), true);
        return false;
      }
      return true;
    },

    /**
    * Boots user to the login screen with an error message
    */
    blockUserAccess: function(message, hideUI) {
      if(hideUI) {
        $('body').addClass('no-ui');
        Origin.trigger('remove:views');
      }
      var cb = hideUI ? Origin.router.navigateToLogin : Origin.router.navigateToHome;

      Origin.Notify.alert({
        type: 'error',
        title: Origin.l10n.t('app.errorpagenoaccesstitle'),
        text: message || Origin.l10n.t('app.errorpagenoaccess'),
        confirmButtonText: Origin.l10n.t('app.ok'),
        callback: cb
      });
    },

    // Persist any dashboard routing for 'Back to courses' link
    // FIXME this shouldn't be here, or work like this...
    evaluateDashboardRoute: function() {
      var loc = Origin.location;
      if (loc && loc.module == 'dashboard') {
        var suffix = loc.route1 ? '/' + loc.route1 : '';
        Origin.dashboardRoute = '#/dashboard' + suffix;
      }
    },

    /**
    * Routing
    */

    formatRoute: function(route) {
      /**
      * We remove leading slashes as they force trigger:true regardless of the
      * options passed to Backbone.Router.navigate
      * See https://github.com/jashkenas/backbone/issues/786
      */
      if(route[0] === '/') return route.slice(1);
      return route;
    },

    persistRoute: function(route) {
      Origin.router.navigate(this.formatRoute(route));
    },

    navigateBack: function() {
      Backbone.history.history.back();
    },

    navigateTo: function(route) {
      // use Origin.router.navigate in case we don't have a valid 'this' reference
      Origin.router.navigate(this.formatRoute(route), { trigger: true });
    },

    navigateToLogin: function() {
      // use Origin.router.navigate in case we don't have a valid 'this' reference
      Origin.router.navigateTo('user/login');
    },

    navigateToHome: function() {
      if(!Origin.router.homeRoute) {
        console.trace('Router.navigateToHome: cannot load homepage, homeRoute not set');
        return;
      }
      // use Origin.router.navigate in case we don't have a valid 'this' reference
      Origin.router.navigateTo(Origin.router.homeRoute);
    },

    handleIndex: function() {
      Origin.trigger('origin:showLoading');
      this.isUserAuthenticated() ? this.navigateToHome() : this.navigateToLogin();
    },

    handleRoute: function(module, route1, route2, route3, route4) {
      Origin.removeViews();
      if(!this.verifyRoute(module, route1)) {
        return;
      }
      this.updateLocation(arguments);
      Origin.trigger('router:' + module, route1, route2, route3, route4);
    },

    /**
    * Event handling
    */

    onOriginInitialize: function() {
      Backbone.history.start();
    }
  });

  return Router;
});
