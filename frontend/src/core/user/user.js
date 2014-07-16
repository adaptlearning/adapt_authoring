define(function(require) {

  var Origin = require('coreJS/app/origin');
  var LoginView = require('coreJS/user/views/loginView');
  var LogoutView = require('coreJS/user/views/logoutView');
  var ForgotPasswordView = require('coreJS/user/views/forgotPasswordView');
  var ResetPasswordView = require('coreJS/user/views/resetPasswordView');
  var UserPasswordResetModel = require('coreJS/user/models/userPasswordResetModel');

  Origin.on('navigation:user:logout', function() {
    Origin.router.navigate('#/user/logout');
  });

  Origin.on('navigation:profile:toggle', function() {
    console.log('Should show profile');
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
        Origin.trigger('location:title:hide');
        currentView = LogoutView;
        break;
      case 'forgot':
        currentView = ForgotPasswordView;
        break;
      case 'reset':
        currentView = ResetView;
        break;
      case 'profile':
        settings.authenticate = true;
        currentView = profileView;
        break;
    }

    if (currentView) {
      Origin.router.createView(currentView, {model: Origin.sessionModel}, settings);
    }
    

  });

})