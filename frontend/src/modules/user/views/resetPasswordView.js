// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var OriginView = require('core/views/originView');
  var Origin = require('core/origin');

  var ResetPasswordView = OriginView.extend({
    tagName: "div",
    className: "reset-password",

    events: {
      'click .form-reset-password button' : 'resetPassword',
      'click button.cancel' : 'goToLogin',
      'click button.return' : 'goToLogin'
    },

    preRender: function() {
      this.listenTo(this.model, {
        sync: this.verifyToken,
        invalid: this.handleValidationError
      });
    },

    postRender: function() {
      this.setViewToReady();
    },

    goToLogin: function(e) {
      e && e.preventDefault();
      Origin.router.navigateToLogin();
    },

    handleValidationError: function(model, error) {
      if (!error) {
        return;
      }
      var msg = "";
      _.each(error, function(value, key) {
        msg += value + '. ';
      }, this);

      this.$('.resetError .message').text(msg);
      this.$('.resetError').removeClass('display-none');
    },

    verifyToken: function() {
      // Invalid token entered, take the user to login
      if (!this.model.get('user')) {
        Origin.router.navigateToLogin();
      }
    },

    resetPassword: function(event) {
      event.preventDefault();

      var toChange = {
        password: this.$('#password').val(),
        confirmPassword: this.$('#confirmPassword').val(),
        id: this.model.get('_id'),
        token: this.model.get('token')
      };
      this.model.save(toChange, {
        patch: true,
        success: _.bind(function(model, response, options) {
          this.$('.form-reset-password').addClass('display-none');
          this.$('.reset-introduction').addClass('display-none');
          this.$('.message .success').removeClass('display-none');
        },this),
        error: _.bind(function(model, response, options) {
          Origin.Notify.alert({
            type: 'error',
            text: Origin.l10n.t('app.resetpassworderror')
          });
        },this)
      });
    }
  }, {
    template: 'resetPassword'
  });

  return ResetPasswordView;

});
