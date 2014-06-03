define(function(require) {

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
// <<<<<<< HEAD
//   var ProjectModel = require('coreJS/project/models/projectModel');
//   var ProjectDetailView = require('coreJS/dashboard/views/projectDetailView');
//   var LogoutView = require('coreJS/user/views/logoutView');
//   var ForgotPasswordView = require('coreJS/user/views/forgotPasswordView');
//   var ResetPasswordView = require('coreJS/user/views/resetPasswordView');
//   var EditorView = require('coreJS/editor/views/editorView');
//   var EditorModel = require('coreJS/editor/models/editorModel');
//   var UserPasswordResetModel = require('coreJS/user/models/userPasswordResetModel');
//   var AssetModel = require('coreJS/asset/models/assetModel');
//   var AssetView = require('coreJS/asset/views/assetView');
//   var AssetCollectionView = require('coreJS/asset/views/assetCollectionView');
// =======
// >>>>>>> develop

  var Router = Backbone.Router.extend({

    routes: {
// <<<<<<< HEAD
//       ""                              : "index",
//       "user/login"                    : "login",
//       "user/logout"                   : "logout",
//       "user/forgot"                   : "forgotpassword",
//       "user/reset/:token"             : "resetpassword",
//       "user/profile"                  : "profile",
//       "project/new"                   : "projectNew",
//       "project/edit/:id"              : "projectEdit",
//       "project/view/:id"              : "projectView",
//       "dashboard"                     : "dashboard",
//       "module"                        : "module",
//       "editor/:courseId/menu"         : "editorMenu",
//       "editor/:courseId/menu/:pageId" : "editorMenu",
//       "editor/:courseId/page/:pageId" : "editorPage",
//       "page/new/:id"                  : "pageNew",
//       "page/edit/:id"                 : "pageEdit",
//       "page/article/edit/:id"         : "pageArticleEdit",
//       "asset"                         : "assetList",
//       "asset/new"                     : "assetNew"
// =======
      "": "handleIndex",
      ":module(/*location)(/*subLocation)(/*action)": "handleRoute"
// >>>>>>> develop
    },

    initialize: function() {
      this.locationKeys = ['module', 'location', 'subLocation', 'action'];
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
      this.navigate('#/dashboard', {trigger: true});
    },

// <<<<<<< HEAD
//     assetNew: function() {
//       var asset = new AssetModel();
//       this.createView(new AssetView({model: asset}));
//     },

//     assetList: function() {
//       this.createView(new AssetCollectionView());
//     },

//     projectEdit: function (id) {
//       var projectModel = new ProjectModel({_id: id});
//       projectModel.fetch();
//       this.createView(new ProjectDetailView({model: projectModel}));
//     },
// =======
    handleRoute: function(module, location, subLocation, action) {
      // Remove views
      this.removeViews();
// >>>>>>> develop

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

    removeViews: function() {
      Origin.trigger('remove:views');
    }

  });

  return Router;

});
