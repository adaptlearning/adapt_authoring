// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

  var Origin = require('coreJS/app/origin');
  var LoginView = require('coreJS/user/views/loginView');
  var UserProfileView = require('coreJS/user/views/userProfileView');
  var UserProfileSidebarView = require('coreJS/user/views/userProfileSidebarView');
  var UserProfileModel = require('coreJS/user/models/userProfileModel');

  var ForgotPasswordView = require('coreJS/user/views/forgotPasswordView');
  var ResetPasswordView = require('coreJS/user/views/resetPasswordView');
  var UserPasswordResetModel = require('coreJS/user/models/userPasswordResetModel');

  Origin.on('navigation:user:logout', function() {
    Origin.router.navigate('#/user/logout');
  });

  Origin.on('navigation:user:profile', function() {
    Origin.router.navigate('#/user/profile');
  });

  Origin.on('router:user', function(location, subLocation, action) {
    var currentView;
    var settings = {};

    settings.authenticate = false;

    switch (location) {
      case 'login':
        Origin.trigger('location:title:hide');
        currentView = LoginView;
        break;
      case 'logout':
        Origin.sessionModel.logout();
        break;
      case 'forgot':
        Origin.trigger('sidebar:sidebarContainer:hide');
        currentView = ForgotPasswordView;
        break;
      case 'reset':
        Origin.trigger('sidebar:sidebarContainer:hide');
        currentView = ResetPasswordView;
        break;      
      case 'profile':
        settings.authenticate = true;
        Origin.trigger('location:title:update', {title: window.polyglot.t('app.editprofiletitle')});        
        currentView = UserProfileView;
        break;
    }

    if (currentView) {
      switch (location) {
        case 'profile':
          var profile = new UserProfileModel(); 
          profile.fetch({
            success: function() {
              Origin.sidebar.addView(new UserProfileSidebarView().$el);
              Origin.router.createView(currentView, {model: profile}, settings);
            }
          });
          break;
        case 'reset':
          var reset = new UserPasswordResetModel({token: subLocation});
          reset.fetch({
            success: function() {
              Origin.router.createView(currentView, {model: reset}, settings);    
            }
          });
          break;
        default:
          Origin.router.createView(currentView, {model: Origin.sessionModel}, settings);  
      }
    }
  });

})