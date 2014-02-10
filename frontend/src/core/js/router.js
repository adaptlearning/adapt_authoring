define(function(require) {

  var Backbone = require('backbone');
  var LoginView = require('coreJS/user/views/loginView');
  var DashboardView = require('coreJS/dashboard/views/dashboardView');
  var AdaptBuilder = require('coreJS/adaptbuilder');
  var ProjectModel = require('coreJS/dashboard/models/projectModel');
  var ProjectDetailView = require('coreJS/dashboard/views/projectDetailView');

  var Router = Backbone.Router.extend({

    routes: {
      ""                : "index",          // 
      "login"           : "login",          // #login
      "logout"          : "logout",         // #logout
      "login/forgot"    : "forgotpassword", // #login/forgot
      "profile"         : "profile",        // #profile
      "project/new"     : "projectNew",
      "project/edit/:id": "projectEdit",    // #project/edit/id
      "project/view/:id": "projectView",    // #project/view/id
      "register"        : "register",       // #register
      "dashboard"       : "dashboard",      // #dashboard
      "module"          : "module"          // #module
    },

    initialize: function() {
      this.currentView = null;
    },

    isUserAuthenticated: function() {
      return AdaptBuilder.userModel.get('authenticated') ? true : false;
    },

    createView: function(initialView, fallbackView) {
      // Remove the existing view
      if (this.currentView) {
        this.currentView.remove();
        AdaptBuilder.trigger('remove:views');
      }

      if (this.isUserAuthenticated()) {
        this.currentView = initialView;
      } else {
        this.currentView = fallbackView
          ? fallbackView 
          : new LoginView({model:AdaptBuilder.userModel});
      }
      
      $('#app').append(this.currentView.$el);

      return this.currentView;
    },

    index: function() {
      if (AdaptBuilder.userModel.get('authenticated')) {
        this.navigate('#dashboard', {trigger: true});
      } else {
        this.navigate('#login', {trigger: true});
      }
    },

    login: function() {
      this.createView(new LoginView({model:AdaptBuilder.userModel}));
    },

    // logout: function () {
    //   this.createView(LogoutView);
    // },

    // forgotpassword: function() {
    //   this.createView(new ForgotPasswordView());
    // },

    dashboard: function() {
      this.createView(new DashboardView());
    },
    /*,

    profile: function () {
      var profileModel = new ProfileModel({id:'me'});
      profileModel.fetch();

      var profileView = new ProfileView({el: '#app', model: profileModel});
      profileView.render();
    },
*/
    projectNew: function() {
      var project = new ProjectModel();

      this.createView(new ProjectDetailView({model: project}));
    },

    projectEdit: function (id) {
      var projectModel = new ProjectModel({_id: id});
      projectModel.fetch();

      this.createView(new ProjectDetailView({model: projectModel}));
    },

/*    projectView: function (id) {
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