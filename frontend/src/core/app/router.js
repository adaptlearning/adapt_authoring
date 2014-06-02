define(function(require) {

  var Backbone = require('backbone');
  var LoginView = require('coreJS/user/views/loginView');
  var DashboardView = require('coreJS/dashboard/views/dashboardView');
  var Origin = require('coreJS/app/origin');
  var EditorView = require('coreJS/editor/views/editorView');
  var EditorModel = require('coreJS/editor/models/editorModel');
  var UserPasswordResetModel = require('coreJS/user/models/userPasswordResetModel');

  var Router = Backbone.Router.extend({

    routes: {
      ""                              : "handleIndex",
      ":module(/*location)(/*subLocation)(/*action)": "handleRoute"
      /*"user/login"                    : "login",
      "user/logout"                   : "logout",
      "user/forgot"                   : "forgotpassword",
      "user/reset/:token"             : "resetpassword",
      "user/profile"                  : "profile",
      "project/new"                   : "projectNew",
      "project/edit/:id"              : "projectEdit",
      "project/view/:id"              : "projectView",
      "dashboard"                     : "dashboard",
      "module"                        : "module",
      "editor/:courseId/menu"         : "editorMenu",
      "editor/:courseId/menu/:pageId" : "editorMenu",
      "editor/:courseId/page/:pageId" : "editorPage",
      "page/new/:id"                  : "pageNew",
      "page/edit/:id"                 : "pageEdit",
      "page/article/edit/:id"         : "pageArticleEdit"*/
    },

    initialize: function() {
      this.locationKeys = ['module', 'location', 'subLocation', 'action'];
    },

    handleRoute: function(module, location, subLocation, action) {
      // Remove views
      this.removeViews();

      var routeArguments = arguments;

      // Set location object
      Origin.location = {};
      _.each(this.locationKeys, function(locationKey, index) {
        Origin.location[locationKey] = routeArguments[index];
      });

      // Trigger location change
      Origin.trigger('location:change', Origin.location);
      // Trigger router event
      Origin.trigger('router:' + module, location, subLocation, action);

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

      $('#app').append(currentView.$el);
      
    },

    handleIndex: function() {
      if (this.isUserAuthenticated()) {
        this.navigate('#/dashboard', {trigger: true});
      } else {
        this.redirectToLogin();
      }
    },

    login: function() {
      this.createView(false, new LoginView({model: Origin.sessionModel}));
    },

    logout: function () {
      this.createView(new LogoutView({model: Origin.sessionModel}));
    },

    forgotpassword: function() {
      this.createView(false, new ForgotPasswordView({model: Origin.sessionModel}));
    },

    resetpassword: function(token) {
      var userPasswordResetModel = new UserPasswordResetModel({token: token});
      userPasswordResetModel.fetch();
      this.createView(false, new ResetPasswordView({model: userPasswordResetModel}));
    },

    dashboard: function() {
      Origin.editor = {};
      Origin.editor.data = {};
      
      if (!this.isUserAuthenticated()) {
        this.navigate('#/user/login', {trigger: true});
      } else {
        this.createView(new DashboardView());
      }
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
    },

    editorMenu: function(courseId, pageId) {
      // EditorView takes in currentCourseId and uses this to retrieve collections and models
      // Passing in currentView enables editorView to load either a menu editing view or a page editing view
      this.createView(new EditorView({
        currentCourseId: courseId, 
        currentView: 'menu', 
        currentPageId: pageId || null
      }));
    },

    editorPage: function (courseId, pageId) {
      // This needs re-factoring as it doesn't need to pass in a model
      // Model is already passed in through Origin.editor.contentObjects.findWhere({_id:id});
      // This should be handled in the editorView.js
      // If this is routed when the editor view is not already created we need to work out a way to push the current page
      // Something along the lines of
      /*if (!Origin.editor.course) {
        We should just show the page as this would have a _courseId added to it
      }*/
      this.createView(new EditorView({
        currentCourseId: courseId, 
        currentView: 'page', 
        currentPageId: pageId
      }));
    },

    removeViews: function() {
      Origin.trigger('remove:views');
    }

  });

  return Router;

});
