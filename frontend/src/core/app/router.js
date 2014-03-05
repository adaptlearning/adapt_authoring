define(function(require) {

  var Backbone = require('backbone');
  var LoginView = require('coreJS/user/views/loginView');
  var DashboardView = require('coreJS/dashboard/views/dashboardView');
  var Origin = require('coreJS/app/origin');
  var ProjectModel = require('coreJS/project/models/projectModel');
  var ProjectDetailView = require('coreJS/dashboard/views/projectDetailView');
  var LogoutView = require('coreJS/user/views/logoutView');
  //var ProjectOverview = require('coreJS/dashboard/views/projectOverview');
  var ForgotPasswordView = require('coreJS/user/views/forgotPasswordView');
  var EditorView = require('coreJS/editor/views/editorView');
  var EditorModel = require('coreJS/editor/models/editorModel');
  var EditorPageEditView = require('coreJS/editor/views/editorPageEditView');
  var EditorArticleEditView = require('coreJS/editor/views/editorArticleEditView');
  var EditorCourseModel = require('coreJS/editor/models/editorCourseModel');
  var EditorContentObjectModel = require('coreJS/editor/models/editorContentObjectModel');


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
      "editor/menu/:id": "editorMenu",
      "editor/page/:id" : "editorPage",
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
      //this.createView(new ProjectOverview({model: projectModel}));
    },

    editorMenu: function(id) {
      //var courseModel = new EditorCourseModel({_id: id});
      this.createView(new EditorView({currentCourseId: id, currentView: 'menu', currentPageId: null}));
    },

    editorPage: function (id) {
      var pageModel = new EditorContentObjectModel({
        _id: id
      });
      this.createView(new EditorView({model: pageModel, currentView: 'page'}));
    },

    removeViews: function() {
      if (this.currentView) {
        this.currentView.remove();
        Origin.trigger('remove:views');
      }
    }/*,

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
    }*/

  });

  return Router;

});
