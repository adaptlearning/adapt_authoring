// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var OriginView = require('core/views/originView');
  var Origin = require('core/origin');
  var Helpers = require('core/helpers');
  var PasswordFieldsView = require('plugins/passwordChange/views/passwordFieldsView');

  var ResetPasswordView = OriginView.extend({
    tagName: "div",
    className: "reset-password",

    events: {
      'click button.submit' : 'resetPassword',
      'click button.cancel' : 'goToLogin',
      'click button.return' : 'goToLogin'
    },

    preRender: function() {
      this.listenTo(this.model, {
        sync: this.verifyToken,
        invalid: this.handleValidationError
      });
      this.model.set('fieldId', 'password');
    },

    postRender: function() {
      var passwordFieldsView = PasswordFieldsView({ model: this.model }).el;
      this.$('#passwordField').append(passwordFieldsView);
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
      var errorHash = {};
      errorHash['password'] = '';
      errorHash['confirmPassword'] = '';

      this.model.trigger('invalid', this.model, errorHash);

      var toChange = {
        password: this.$('#password').val(),
        confirmPassword: this.$('#confirmPassword').val(),
        id: this.model.get('_id'),
        token: this.model.get('token')
      };
      var self = this;
      this.model.save(toChange, {
        patch: true,
        success: _.bind(function(model, response, options) {
          this.$('.form-reset-password').addClass('display-none');
          this.$('.reset-introduction').addClass('display-none');
          this.$('.message .success').removeClass('display-none');
        },this),
        error: _.bind(function(model, response, options) {
          // for server error messages - will remove in future
          var errMsg = Helpers.translateData(response);
          self.$(`#passwordError`).html(errMsg);
          self.$(`#confirmPasswordError`).html('');
        },this)
      });
    }
  }, {
    template: 'resetPassword'
  });

  return ResetPasswordView;

});
