define(function(require) {
  
  var Backbone = require('backbone'),
      HomeView = require('coreViews/homeView'),
      LoginView = require('coreViews/loginView'),
      ForgotPasswordView = require('coreViews/forgotPasswordView'),
      DashboardView = require('coreViews/dashboardView'),
      AdaptBuilder = require('coreJS/adaptbuilder'),
      ProjectCollection = require('coreCollections/projectCollection'),
      ProjectListView = require('coreViews/projectListView'),
      DashboardMenuView = require('coreViews/dashboardMenuView');
  
  var Router = Backbone.Router.extend({
    
    routes: { 
      ""              : "index",          //
      "home"          : "index",          // #home
      "login"         : "login",          // #login
      "login/forgot"  : "forgotpassword", // #login/forgot
      "register"      : "register",       // #register
      "dashboard"     : "dashboard",      // #dashboard
      "module"        : "module"          // #module
    },

    initialize: function() {},

    _renderView: function(view) {
      $("#app").html(view.render().el);
    },

    index: function() {
      var view = new HomeView();
      this._renderView(view);
    },

    login: function() {
      var view = new LoginView();
      this._renderView(view);
    },

    forgotpassword: function() {
      var view = new ForgotPasswordView();
      this._renderView(view);
    },
    
    dashboard: function() {
      var dashboardView = new DashboardView();
      this._renderView(dashboardView);
      
      var dashboardMenuView = new DashboardMenuView();
      $("#dashboardMenu").html(dashboardMenuView.render().el);
      
      var projects = new ProjectCollection();
      var projectListView = new ProjectListView({collection: projects});
      $("#projects").html(projectListView.render().el);
    }

  });
  
  return new Router;
  
});