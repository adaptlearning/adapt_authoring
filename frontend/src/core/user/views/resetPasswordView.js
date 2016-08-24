// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var OriginView = require('coreJS/app/views/originView');
  var Origin = require('coreJS/app/origin');

  var ResetPasswordView = OriginView.extend({
    tagName: "div",
    className: "reset-password",

    events: {
      'click .form-reset-password button' : 'resetPassword',
      'click button.cancel' : 'goToLogin',
      'click button.return' : 'goToLogin'
    },

    preRender: function() {
      this.listenTo(this.model, 'sync', this.verifyToken);
      this.listenTo(this.model, 'invalid', this.handleValidationError);
    },

    postRender: function() {
      this.setViewToReady();
    },

    goToLogin: function(e) {
      e && e.preventDefault();
      Origin.router.navigate('#/user/login', { trigger: true });
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
        Origin.router.navigate('#/user/login', {trigger: true});
      }
    },

    resetPassword: function(event) {
      event.preventDefault();

      this.model.set('password', this.$('#password').val());
      this.model.set('confirmPassword', this.$('#confirmPassword').val());

      this.model.save({}, {
        success: _.bind(function(model, response, options) {
          if (response.success) {
            this.$('.form-reset-password').addClass('display-none');
            this.$('.reset-introduction').addClass('display-none');

            this.$('.message .success').removeClass('display-none');
          }
        },this),
        error: _.bind(function(model, response, options) {
          Origin.Notify.alert({
            type: 'error',
            text: window.polyglot.t('app.resetpassworderror')
          });
        },this)
      });
    }
  }, {
    template: 'resetPassword'
  });

  return ResetPasswordView;

});
