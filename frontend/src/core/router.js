// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var _ = require('underscore');
  var Backbone = require('backbone');
  var Origin = require('core/origin');
  var PermissionsView = require('core/views/permissionsView');

  var Router = Backbone.Router.extend({
    homeRoute: '',
    routes: {
      '': 'handleIndex',
      '_=_': 'handleIndex',
      ':module(/*route1)(/*route2)(/*route3)(/*route4)': 'handleRoute'
    },

    initialize: function() {
      this.locationKeys = ['module', 'route1', 'route2', 'route3', 'route4'];
      this.resetLocation();
    },

    setLocation: function(routeArgs) {
      this.resetLocation();
      _.each(this.locationKeys, function(key, index) {
        Origin.location[key] = routeArgs[index];
      });
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

    // Persist any dashboard routing for 'Back to courses' link
    // FIXME this shouldn't be here, or work like this...
    evaluateDashboardRoute: function() {
      var loc = Origin.location;
      if (loc && loc.module == 'dashboard') {
        var suffix = loc.route1 ? '/' + loc.route1 : '';
        Origin.dashboardRoute = '/#/dashboard' + suffix;
      }
    },

    /**
    * Routing
    */

    navigateTo: function(route, options) {
      var prefix = '#/'
      if(route.slice(0,2) !== prefix) {
        route = prefix + route;
      }
      // use the global object in case we don't have a valid 'this' reference
      Origin.router.navigate(route, _.defaults(options || {}, { trigger: true }));
    },

    navigateToLogin: function() {
      // use the global object in case we don't have a valid 'this' reference
      Origin.router.navigateTo('user/login');
    },

    navigateToHome: function() {
      // use the global object in case we don't have a valid 'this' reference
      if(!this.homeRoute) {
        console.log('Router.navigateToHome: cannot load homepage, homeRoute not set');
        return;
      }
      Origin.router.navigateTo(this.homeRoute);
    },

    handleIndex: function() {
      // Show loading on any route
      Origin.trigger('origin:showLoading');

      if (this.isUserAuthenticated()) {
        return this.navigateToHome();
      } else {
        return this.navigateToLogin();
      }
    },

    handleRoute: function(module, route1, route2, route3, route4) {
      // Show loading on any route
      Origin.trigger('origin:showLoading');
      // Remove views
      Origin.removeViews();
      // Check this user has permissions
      if (!Origin.permissions.checkRoute(Backbone.history.fragment)) {
        Origin.trigger('sidebar:sidebarContainer:hide');
        Origin.trigger('location:title:hide');
        return $('.app-inner').append(new PermissionsView().$el);
      }
      // Verify the user is authenticated
      if (!this.isUserAuthenticated()  && (module !== 'user' && route1 !== 'login')) {
        Origin.Notify.alert({
          type: 'error',
          text: window.polyglot.t('app.errorsessionexpired')
        });
        return this.navigateToLogin();
      }

      var routeArguments = arguments;
      // Set previous location object
      Origin.previousLocation = Origin.location;
      this.evaluateDashboardRoute();
      this.setLocation(routeArguments);
      // Trigger location change
      Origin.trigger('location:change', Origin.location);

      var locationClass = 'module-' + Origin.location.module;
      if (Origin.location.route1) {
        locationClass += ' location-' + Origin.location.route1
      }
      $('body').removeClass().addClass(locationClass);
      // Trigger router event
      Origin.trigger('router:' + module, route1, route2, route3, route4);
    }
  });

  return Router;
});
