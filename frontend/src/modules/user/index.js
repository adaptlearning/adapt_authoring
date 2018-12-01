// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var ForgotPasswordView = require('./views/forgotPasswordView');
  var LoginView = require('./views/loginView');
  var ResetPasswordView = require('./views/resetPasswordView');
  var UserPasswordResetModel = require('./models/userPasswordResetModel');
  var UserProfileModel = require('./models/userProfileModel');
  var UserProfileView = require('./views/userProfileView');

  Origin.on('navigation:user:logout', function() {
    Origin.router.navigateTo('user/logout');
  });

  Origin.on('navigation:user:profile', function() {
    Origin.router.navigateTo('user/profile');
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
        Origin.sidebar.hide();
        currentView = ForgotPasswordView;
        break;
      case 'reset':
        Origin.sidebar.hide();
        currentView = ResetPasswordView;
        break;
      case 'profile':
        settings.authenticate = true;
        Origin.trigger('location:title:update');
        currentView = UserProfileView;
        break;
    }

    if(!currentView) {
      return;
    }
    if(location === 'profile') {
      var profile = new UserProfileModel();
      profile.fetch({
        success: function() {
          Origin.sidebar.update([
            { name: 'save', type: 'primary', labels: { default: 'app.save' } },
            { name: 'cancel', type: 'secondary', labels: { default: 'app.cancel' } },
          ]);
          Origin.contentPane.setView(currentView, { model: profile });
        }
      });
    } else if(location === 'reset') {
      var reset = new UserPasswordResetModel({token: subLocation});
      reset.fetch({
        success: function() {
          Origin.contentPane.setView(currentView, { model: reset });
        }
      });
    } else {
      Origin.contentPane.setView(currentView, { model: Origin.sessionModel });
    }
  });

})
