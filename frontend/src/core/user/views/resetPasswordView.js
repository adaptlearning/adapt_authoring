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
      'click button.cancel' : 'goToLogin'
    },

    preRender: function() {
      this.listenTo(this.model, 'sync', this.verifyToken);
      this.listenTo(this.model, 'invalid', this.handleValidationError);
    },

    postRender: function() {
      this.setViewToReady();
    },

    goToLogin: function(e) {
      e.preventDefault();

      Origin.router.navigate('#/user/login', {trigger: true});
    },

    handleValidationError: function(model, error) {
      var self = this;

      if (error && _.keys(error).length !== 0) {
        _.each(error, function(value, key) {
          self.$('#' + key + 'Error').text(value);
        });
      }
    },

    verifyToken: function() {
      if (!this.model.get('user')) {
        // Invalid token entered, take the user to login
        Origin.router.navigate('#/user/login', {trigger: true});
      }
    },

    resetPassword: function(event) {
      event.preventDefault();

      var self = this;

      self.model.set('password', self.$('#password').val());
      self.model.set('confirmPassword', self.$('#confirmPassword').val());

      self.model.save({}, {
        success: function(model, response, options) {
          if (response.success) {
            Origin.Notify.alert({
              type: 'success',
              text: window.polyglot.t('app.resetpasswordsuccess')
            });
            Origin.router.navigate('#/user/login', {trigger: true});
          }
        },
        error: function(model, response, options) {
          Origin.Notify.alert({
            type: 'error',
            text: window.polyglot.t('app.resetpassworderror')
          });
        }
      });
    }

  }, {
    template: 'resetPassword'
  });

  return ResetPasswordView;

});
