// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');

  var LoginView = OriginView.extend({

    className: 'login',

    tagName: "div",

    events: {
      'keydown #login-input-username' : 'clearErrorStyling',
      'keydown #login-input-password' : 'clearErrorStyling',
      'click .login-form-submit'      : 'submitLoginDetails',
      'click button.dash'             : 'goHome'
    },

    preRender: function() {
      this.listenTo(Origin, 'login:failed', this.loginFailed, this);
    },

    postRender: function() {
      this.setViewToReady();
      Origin.trigger('login:loaded');
    },

    goHome: function(e) {
      e && e.preventDefault();
      Origin.router.navigateToHome();
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
      $('#loginError').addClass('display-none');

      this.handleEnterKey(e);
    },

    submitLoginDetails: function(e) {
      e && e.preventDefault();

      var inputUsernameEmail = $.trim(this.$("#login-input-username").val());
      var inputPassword = $.trim(this.$("#login-input-password").val());
      var shouldPersist = this.$('#remember-me').prop('checked');

      // Validation
      if (inputUsernameEmail === '' || inputPassword === '') {
        this.loginFailed(LoginView.ERR_MISSING_FIELDS);
        return false;
      } else {
        $('#login-input-username').removeClass('input-error');
      }

      var userModel = this.model;

      userModel.login(inputUsernameEmail, inputPassword, shouldPersist);
    },

    loginFailed: function(errorCode) {
      var errorMessage = '';

      switch (errorCode) {
        case LoginView.ERR_INVALID_CREDENTIALS:
        case LoginView.ERR_MISSING_FIELDS:
          errorMessage = Origin.l10n.t('app.invalidusernameorpassword');
          break;
        case LoginView.ERR_ACCOUNT_LOCKED:
          errorMessage = Origin.l10n.t('app.accountislocked');
          break;
        case LoginView.ERR_TENANT_DISABLED:
          errorMessage = Origin.l10n.t('app.tenantnotenabled');
          break;
        case LoginView.ERR_ACCOUNT_INACTIVE:
          errorMessage = Origin.l10n.t('app.accountnotactive');
          break;
      }

      $('#login-input-username').addClass('input-error');
      $('#login-input-password').val('');
      $('#loginErrorMessage').text(errorMessage);
      $('#loginError').removeClass('display-none');
    }

  }, {
    ERR_INVALID_CREDENTIALS: 1,
    ERR_ACCOUNT_LOCKED: 2,
    ERR_MISSING_FIELDS: 3,
    ERR_TENANT_DISABLED: 4,
    ERR_ACCOUNT_INACTIVE: 5,
    template: 'login'
  });

  return LoginView;

});
