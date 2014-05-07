define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');

  var LoginView = OriginView.extend({

    className: 'login',

    tagName: "div",

    events: {
      'keydown #login-input-username' : 'clearErrorStyling',
      'click .login-form button':'submitLoginDetails'
    },

    preRender: function() {
      this.listenTo(Origin, 'loginFailed', this.loginFailed, this);
    },
    
    clearErrorStyling: function(e) {
      $('#login-input-username').removeClass('input-error');
      $('#loginErrorMessage').text('');
    },

    submitLoginDetails: function(e) {
      e.preventDefault();

      var inputUsernameEmail = this.$("#login-input-username").val();
      var inputPassword = this.$("#login-input-password").val();

      // Validation
      if (inputUsernameEmail === '' || inputPassword === '') {
        this.loginFailed();
      } else {
        $('#login-input-username').removeClass('input-error');
      }

      var userModel = this.model;

      userModel.login(inputUsernameEmail, inputPassword, function(err, result){
        if( err || !result.success) {
          Origin.trigger('loginFailed');
        } else {
          Backbone.history.navigate('#/dashboard', {trigger: true});
        }
      });
    },

    loginFailed: function() {
      $('#login-input-username').addClass('input-error');
      $('#loginErrorMessage').text(window.polyglot.t('app.invalidusernameoremail'));

      return false;
    }

  }, {
    template: 'login'
  });

  return LoginView;

});
