define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');

  var LoginView = OriginView.extend({

    className: 'login',

    tagName: "div",

    events: {
      'keydown #login-input-username' : 'clearErrorStyling',
      'click .login-form-submit'      : 'submitLoginDetails',
      'keydown #login-input-password' : 'handleEnterKey'
    },

    preRender: function() {
      this.listenTo(Origin, 'login:failed', this.loginFailed, this);
    },
    
    handleEnterKey: function(e) {
      var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;

      if (key == 13) {
        e.preventDefault();
        this.submitLoginDetails();
      }
    },

    clearErrorStyling: function(e) {
      $('#login-input-username').removeClass('input-error');
      $('#loginErrorMessage').text('');

      this.handleEnterKey(e);
    },

    submitLoginDetails: function(e) {
      e && e.preventDefault();

      var inputUsernameEmail = $.trim(this.$("#login-input-username").val()).toLowerCase();
      var inputPassword = $.trim(this.$("#login-input-password").val());

      // Validation
      if (inputUsernameEmail === '' || inputPassword === '') {
        this.loginFailed();
        return false;
      } else {
        $('#login-input-username').removeClass('input-error');
      }

      var userModel = this.model;

      userModel.login(inputUsernameEmail, inputPassword, function(err, result){
        if( err || !result.success) {
          this.loginFailed();
        } else {
          Backbone.history.navigate('#/dashboard', {trigger: true});
        }
      });
    },

    loginFailed: function() {
      $('#login-input-username').addClass('input-error');
      $('#loginErrorMessage').text(window.polyglot.t('app.invalidusernameoremail'));
    }

  }, {
    template: 'login'
  });

  return LoginView;

});
