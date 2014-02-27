define(function(require) {

  var Backbone = require('backbone');
  var LoginView = require('coreJS/user/views/loginView');
  var DashboardView = require('coreJS/dashboard/views/dashboardView');
  var AdaptBuilder = require('coreJS/app/adaptbuilder');
  var ProjectModel = require('coreJS/project/models/projectModel');
  var ProjectDetailView = require('coreJS/dashboard/views/projectDetailView');
  var LogoutView = require('coreJS/user/views/logoutView');
  //var ProjectOverview = require('coreJS/dashboard/views/projectOverview');
  var ForgotPasswordView = require('coreJS/user/views/forgotPasswordView');
  var EditorView = require('coreJS/editor/views/editorView');
  var PageModel = require('coreJS/editor/models/pageModel');
  var PageEditView = require('coreJS/editor/views/pageEditView');
  var PageArticleEditView = require('coreJS/editor/views/pageArticleEditView');
  var PageArticleModel = require('coreJS/editor/models/pageArticleModel');
  var EditorModel = require('coreJS/editor/models/editorModel');
  var PageCollection = require('coreJS/editor/collections/pageCollection');


  var Router = Backbone.Router.extend({

    routes: {
      ""                : "index",
      "user/login"      : "login",
      "user/logout"     : "logout",
      "user/forgot"     : "forgotpassword",
      "user/register"   : "register",
      "user/profile"    : "profile",
      "project/new"     : "projectNew",
      "project/edit/:id": "projectEdit",
      "project/view/:id": "projectView",
      "dashboard"       : "dashboard",
      "module"          : "module",
      "editor/view/:id" : "editor",
      "page/new/:id"    : "pageNew",
      "page/edit/:id"   : "pageEdit",
      "page/article/edit/:id": "pageArticleEdit"
    },

    initialize: function() {
      this.currentView = null;
    },

    isUserAuthenticated: function() {
      return AdaptBuilder.sessionModel.get('isAuthenticated') ? true : false;
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
          : new LoginView({model:AdaptBuilder.sessionModel});
      }
      
      $('#app').append(this.currentView.$el);

      return this.currentView;
    },

    index: function() {
      if (AdaptBuilder.sessionModel.get('isAuthenticated')) {
        this.navigate('#/dashboard', {trigger: true});
      } else {
        this.navigate('#/user/login', {trigger: true});
      }
    },

    login: function() {
      this.createView(false, new LoginView({model: AdaptBuilder.sessionModel}));
    },

    logout: function () {
      this.createView(new LogoutView({model: AdaptBuilder.sessionModel}));
    },

    forgotpassword: function() {
      this.createView(false, new ForgotPasswordView());
    },

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

    projectView: function (id) {
      var projectModel = new ProjectModel({_id: id});
      projectModel.fetch();
      //this.createView(new ProjectOverview({model: projectModel}));
    },

    editor: function (id) {
      AdaptBuilder.currentProjectId = id;
      
      var editorModel = new EditorModel({_id: id});

      editorModel.fetch();
 
      this.createView(new EditorView({model: editorModel}));
    },

    pageNew: function (parentId) {
      var pageModel = new PageModel({_parentId: parentId});

      this.createView(new PageEditView({model: pageModel}));
    },

    pageEdit: function (id) {
      var pageModel = new PageModel({_id:id});
      pageModel.fetch();
      this.createView(new PageEditView({model: pageModel}));
    },

    pageArticleEdit: function(id) {
      var pageArticleModel = new PageArticleModel({_id: id});
      pageArticleModel.fetch();
      this.createView(new PageArticleEditView({model: pageArticleModel}));
    }

  });

  return Router;

});
