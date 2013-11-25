define(function(require) {
  
  var Backbone = require('backbone'),
      HomeView = require('coreViews/homeView'),
      LoginView = require('coreViews/loginView'),
      ForgotPasswordView = require('coreViews/forgotPasswordView'),
      DashboardView = require('coreViews/dashboardView');
  
  var Router = Backbone.Router.extend({
    
    routes: { 
      ""              : "index",          //
      "home"          : "index",          // #home
      "login"         : "login",          // #login
      "login/forgot"  : "forgotpassword", // #login/forgot
      "register"      : "register",       // #register
      "dashboard"     : "dashboard"       // #dashboard
    },

    initialize: function() {
     console.log('In init');
    },

    _renderView: function(view) {
      $("#app").html(view.render().el);
    },

    index: function() {
      console.log('In index');
      var view = new HomeView();
      this._renderView(view);
    },

    login: function() {
      console.log('Login');
      var view = new LoginView();
      this._renderView(view);
    },

    forgotpassword: function() {
      var view = new ForgotPasswordView();
      this._renderView(view);
    },
    
    dashboard: function() {
      var view = new DashboardView();
      this._renderView(view);
    }

  });
  
  return new Router;
  
});