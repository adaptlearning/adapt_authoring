define(function(require) {

  var Backbone = require('backbone'),
      LoginView = require('coreViews/loginView'),
      DashboardView = require('coreViews/dashboardView'),
      AdaptBuilder = require('coreJS/adaptbuilder')


  var Router = Backbone.Router.extend({

    routes: {
      ""                : "index",          // 
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

    },

    index: function() {
      console.log(AdaptBuilder.userModel);
      if (AdaptBuilder.userModel.get('authenticated')) {
        this.navigate('#dashboard', {trigger: true});
      } else {
        this.navigate('#login', {trigger: true});
      }
    },

    login: function() {
      new LoginView({model: AdaptBuilder.userModel});
    },/*

    logout: function () {
      var view = new LogoutView({model:loginModel, el:'#app'});
      view.render();
    },

    forgotpassword: function() {
      var view = new ForgotPasswordView({model:loginModel, el:'#app'});
      view.render();
    },*/

    checkAuthentication: function() {
      if (AdaptBuilder.userModel.get('authenticated')) {
        return true;
      }
      return false;
    },

    createView: function(initialView, fallbackView) {
      if (this.currentView) {
        this.currentView.remove();
        AdaptBuilder.trigger('remove:views');
      }
      if (this.checkAuthentication()) {
        return this.currentView = new initialView();
      } 
      if (fallbackView) {
        return this.currentView = new fallbackView();
      }
      return this.currentView = new LoginView();
    },

    dashboard: function() {
      this.createView(DashboardView, LoginView);
    }/*,

    profile: function () {
      var profileModel = new ProfileModel({id:'me'});
      profileModel.fetch();

      var profileView = new ProfileView({el: '#app', model: profileModel});
      profileView.render();
    },

    projectEdit: function (id) {
      console.log('Show project details for :: ' + id);

      id = (id==-1)
            ?null
            :{id:id};

      var projectModel = new ProjectModel(id);

      var projectDetailView = new ProjectDetailView({el: '#app', model: projectModel});
      projectDetailView.render();
    },

    projectView: function (id) {
      console.log('Show project content for :: ' + id);

      var projectModel = new ProjectModel({id:id});

      var projectOverview = new ProjectOverview({el: '#app', model: projectModel});

      projectOverview.on('rendered',function () {
        var projectContents = new ProjectContentCollection({projectid:id});
        var projectContentListView = new ProjectContentListView({collection: projectContents, el:projectOverview.$('.project-content-view')});
        var projectOverviewMenuModel = new ProjectOverviewMenuModel();
        var projectOverviewMenu = new ProjectOverviewMenu({ el:projectOverview.$('.project-content-menu'), model: projectOverviewMenuModel });
        projectOverviewMenu.render();

      });

      projectOverview.render();
    }*/

  });

  return Router;

});