define(function(require) {
  var Backbone = require('backbone');
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
    var options = {};
    options.authenticate = false;

    switch (location) {
      case 'login':
        currentView = LoginView;
        break;
      case 'logout':
        currentView = LogoutView;
        break;
      case 'forgot':
        currentView = ForgotPasswordView;
        break;
      case 'reset':
        currentView = ResetView;
        break;
      case 'profile':
        options.authenticate = true;
        currentView = profileView;
        break;
    }

    Origin.router.createView(new currentView({model: Origin.sessionModel}), options);

  });

})