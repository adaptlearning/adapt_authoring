define(function(require) {

  var Backbone = require('backbone');
  var LoginView = require('coreJS/user/views/loginView');
  var DashboardView = require('coreJS/dashboard/views/dashboardView');
  var Origin = require('coreJS/app/origin');
  var ProjectModel = require('coreJS/project/models/projectModel');
  var ProjectDetailView = require('coreJS/dashboard/views/projectDetailView');
  var LogoutView = require('coreJS/user/views/logoutView');
  var ForgotPasswordView = require('coreJS/user/views/forgotPasswordView');
  var EditorView = require('coreJS/editor/views/editorView');
  var EditorModel = require('coreJS/editor/models/editorModel');

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
      "editor/:courseId/menu": "editorMenu",
      "editor/:courseId/page/:pageId" : "editorPage",
      "page/new/:id"    : "pageNew",
      "page/edit/:id"   : "pageEdit",
      "page/article/edit/:id": "pageArticleEdit"
    },

    initialize: function() {
      this.currentView = null;
      this.listenTo(this, 'route', this.removeViews);
    },

    route: function(route, name, callback) {
      if (!_.isRegExp(route)) route = this._routeToRegExp(route);
      if (_.isFunction(name)) {
        callback = name;
        name = '';
      }
      if (!callback) callback = this[name];
      var router = this;
      Backbone.history.route(route, function(fragment) {
        router.trigger('route', name, args);
        var args = router._extractParameters(route, fragment);
        callback && callback.apply(router, args);
        router.trigger.apply(router, ['route:' + name].concat(args));
        Backbone.history.trigger('route', router, name, args);
      });
      return this;
    },

    isUserAuthenticated: function() {
      return Origin.sessionModel.get('isAuthenticated') ? true : false;
    },

    createView: function(initialView, fallbackView) {
      _.defer(_.bind(function() {
        if (this.isUserAuthenticated()) {
        this.currentView = initialView;
      } else {
        this.currentView = fallbackView
          ? fallbackView 
          : new LoginView({model:Origin.sessionModel});
      }
      
      $('#app').append(this.currentView.$el);

      return this.currentView;
      }, this));
      
    },

    index: function() {
      if (Origin.sessionModel.get('isAuthenticated')) {
        this.navigate('#/dashboard', {trigger: true});
      } else {
        this.navigate('#/user/login', {trigger: true});
      }
    },

    login: function() {
      this.createView(false, new LoginView({model: Origin.sessionModel}));
    },

    logout: function () {
      this.createView(new LogoutView({model: Origin.sessionModel}));
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
    },

    editorMenu: function(courseId) {
      // EditorView takes in currentCourseId and uses this to retrieve collections and models
      // Passing in currentView enables editorView to load either a menu editing view or a page editing view
      this.createView(new EditorView({
        currentCourseId: courseId, 
        currentView: 'menu', 
        currentPageId: null
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
      if (this.currentView) {
        this.currentView.remove();
        Origin.trigger('remove:views');
      }
    }

  });

  return Router;

});
