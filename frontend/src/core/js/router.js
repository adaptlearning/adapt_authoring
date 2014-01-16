define(function(require) {

  var Backbone = require('backbone'),
      HomeView = require('coreViews/homeView'),
      LoginView = require('coreViews/loginView'),
      LogoutView = require('coreViews/logoutView'),
      LoginModel = require('coreModels/loginModel'),
      ProfileView = require('coreViews/profileView'),
      ProfileModel = require('coreModels/profileModel'),
      ForgotPasswordView = require('coreViews/forgotPasswordView'),
      DashboardView = require('coreViews/dashboardView'),
      AdaptBuilder = require('coreJS/adaptbuilder'),
      ProjectCollection = require('coreCollections/projectCollection'),
      ProjectListView = require('coreViews/projectListView'),
      ProjectDetailView = require('coreViews/projectDetailView'),
      ProjectModel = require('coreModels/projectModel'),
      DashboardMenuView = require('coreViews/dashboardMenuView');

  var loginModel = new LoginModel();

  loginModel.fetch();

  console.log('Logged in is ' + loginModel.get('authenticated'));

  var Router = Backbone.Router.extend({

    routes: {
      ""              : "index",          //
      "home"          : "index",          // #home
      "login"         : "login",          // #login
      "logout"        : "logout",         // #logout
      "login/forgot"  : "forgotpassword", // #login/forgot
      "profile"       : "profile",        // #profile
      "project/:id"   : "project",        // #project/id
      "register"      : "register",       // #register
      "dashboard"     : "dashboard",      // #dashboard
      "module"        : "module"          // #module
    },

    initialize: function() {

      //Listen for route event and notify
      this.on('route', function(route){
        AdaptBuilder.trigger('route:changed',{route:route});
      },this);

    },

    index: function() {
      var view = new HomeView({el:'#app'});
      view.render();
    },

    login: function() {
      var view = new LoginView({model:loginModel, el:'#app'});
      view.render();
    },

    logout: function () {
      var view = new LogoutView({model:loginModel, el:'#app'});
      view.render();
    },

    forgotpassword: function() {
      var view = new ForgotPasswordView({model:loginModel, el:'#app'});
      view.render();
    },

    dashboard: function() {
      var dashboardView = new DashboardView({el:'#app'});
      dashboardView.render();

      var dashboardMenuView = new DashboardMenuView({el:'#dashboardMenu'});
      dashboardView.render();

      var projects = new ProjectCollection();
      var projectListView = new ProjectListView({collection: projects, el:'#projects'});
      projectListView.render();
    },

    profile: function () {
      var profileModel = new ProfileModel({id:'me'});
      profileModel.fetch();

      var profileView = new ProfileView({el: '#app', model: profileModel});
      profileView.render();
    },

    project: function (id) {
      console.log('Show project details for :: ' + id);
      var projectModel = new ProjectModel({id: id});
      projectModel.url = '/api/content/project/' + id; //@todo : could be clevererer

      var projectDetailView = new ProjectDetailView({el: '#app', model: projectModel});
      projectDetailView.render();
    }

  });

  return new Router;

});