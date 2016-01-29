// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var PermissionsView = require('coreJS/app/views/permissionsView');

  var Router = Backbone.Router.extend({

    routes: {
      ""                                      : "handleIndex",
      "_=_"                                   : "handleIndex",  
      ":module(/*route1)(/*route2)(/*route3)(/*route4)" : "handleRoute"
    },

    initialize: function() {
      // Setup listeners for the loading screen
      Origin.on('router:hideLoading', this.hideLoading, this);
      Origin.on('router:showLoading', this.showLoading, this);
      // Store loading element
      this.$loading = $('.loading');

      this.locationKeys = ['module', 'route1', 'route2', 'route3', 'route4'];
    },

    isUserAuthenticated: function() {
      return Origin.sessionModel.get('isAuthenticated') ? true : false;
    },

    redirectToLogin: function() {
       this.navigate('#/user/login', {trigger: true});
    },

    createView: function(View, viewOptions, settings) {

      var viewOptions = (viewOptions || {});
      var settings = (settings || {});
      var currentView;

      if (this.isUserAuthenticated()) {
        currentView = new View(viewOptions);
      } else {
        if (settings.authenticate === false) {
          currentView = new View(viewOptions);
        } else {
          return this.redirectToLogin();
        }
      }

      $('.app-inner').append(currentView.$el);

    },

    handleIndex: function() {
      // Show loading on any route
      this.showLoading();
      // console.log('in handleIndex');
      if (this.isUserAuthenticated()) {
        this.navigate('#/dashboard', {trigger: true});
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
      this.showLoading();
      // Remove views
      this.removeViews();

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
    },

    removeViews: function() {
      Origin.trigger('remove:views');
    },

    showLoading: function(shouldHideTopBar) {
      // Sometimes you might want to disable the top bar too
      if (shouldHideTopBar) {
        this.$loading.removeClass('display-none fade-out').addClass('cover-top-bar');
      } else {
        this.$loading.removeClass('display-none fade-out');
      }
    },

    hideLoading: function() {
      this.$loading.addClass('fade-out');
      _.delay(_.bind(function() {
        this.$loading.addClass('display-none').removeClass('cover-top-bar');
      }, this), 300);

    }

  });

  return Router;

});
