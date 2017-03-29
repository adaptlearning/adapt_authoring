// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('core/origin');
  var PermissionsView = require('core/views/permissionsView');

  var Router = Backbone.Router.extend({
    routes: {
      '': 'handleIndex',
      '_=_': 'handleIndex',
      ':module(/*route1)(/*route2)(/*route3)(/*route4)': 'handleRoute'
    },

    initialize: function() {
      this.locationKeys = ['module', 'route1', 'route2', 'route3', 'route4'];
    },

    isUserAuthenticated: function() {
      return Origin.sessionModel.get('isAuthenticated') ? true : false;
    },

    redirectToLogin: function() {
      this.navigate('#/user/login', { trigger: true });
    },

    handleIndex: function() {
      // Show loading on any route
      Origin.trigger('origin:showLoading');

      if (this.isUserAuthenticated()) {
        this.navigate('#/dashboard', { trigger: true });
      } else {
        return this.redirectToLogin();
      }
    },

    // Persist any dashboard routing for 'Back to courses' link
    evaluateDashboardRoute: function() {
      if (Origin.location && Origin.location.module == 'dashboard') {
        var suffix = Origin.location.route1
          ? '/' + Origin.location.route1
          : '';
        Origin.dashboardRoute = '/#/dashboard' + suffix;
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
        return this.redirectToLogin();
      }

      var routeArguments = arguments;
      // Set previous location object
      Origin.previousLocation = Origin.location;
      this.evaluateDashboardRoute();
      // Set location object
      Origin.location = {};
      _.each(this.locationKeys, function(locationKey, index) {
        Origin.location[locationKey] = routeArguments[index];
      });
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
