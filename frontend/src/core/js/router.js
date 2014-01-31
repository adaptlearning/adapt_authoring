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
      ProjectOverview = require('coreViews/projectOverview');

  var loginModel = new LoginModel();

  loginModel.fetch();

  console.log('Logged in is ' + loginModel.get('authenticated'));

  var Router = Backbone.Router.extend({

    routes: {
      ""                : "index",          //
      "home"            : "index",          // #home
      "login"           : "login",          // #login
      "logout"          : "logout",         // #logout
      "login/forgot"    : "forgotpassword", // #login/forgot
      "profile"         : "profile",        // #profile
      "project/edit/:id": "projectEdit",    // #project/edit/id
      "project/view/:id": "projectView",    // #project/view/id
      "register"        : "register",       // #register
      "dashboard"       : "dashboard",      // #dashboard
      "module"          : "module"          // #module
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

      var projects = new ProjectCollection();
      var projectListView = new ProjectListView({collection: projects, el:dashboardView.$('#projects')});
      projectListView.render();
    },

    profile: function () {
      var profileModel = new ProfileModel({id:'me'});
      profileModel.fetch();

      var profileView = new ProfileView({el: '#app', model: profileModel});
      profileView.render();
    },

    projectEdit: function (id) {
      console.log('Show project details for :: ' + id);

      id = id==-1?null:{id:id};

      var projectModel = new ProjectModel(id);

      var projectDetailView = new ProjectDetailView({el: '#app', model: projectModel});
      projectDetailView.render();
    },

    projectView: function (id) {
      console.log('Show project content for :: ' + id);

      var projectModel = new ProjectModel({id:id});

      var projectOverview = new ProjectOverview({el: '#app', model: projectModel});
      projectOverview.render();

      var projectContentListView = new ProjectContentListView({el:'.project-content-view'});

    }

  });

  return new Router;

});