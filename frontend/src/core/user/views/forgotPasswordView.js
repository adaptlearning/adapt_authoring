// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Helpers = require('coreJS/app/helpers');
  var OriginView = require('coreJS/app/views/originView');
  var Origin = require('coreJS/app/origin');

  var ForgotPasswordView = OriginView.extend({
    
    tagName: "div",

    className: "forgot-password",

    events: {
      'click button.submit' : 'requestResetToken',
      'click button.cancel' : 'goToLogin',
      'keydown .input-username-email' : 'handleKeydown'
    },

    postRender: function() {
      this.setViewToReady();
    },

    goToLogin: function(e) {
      e.preventDefault();
      Origin.router.navigate('#/user/login', {trigger: true});
    },

    handleKeydown: function(e) {
      this.$('.input-username-email').removeClass('input-error');
      this.$('.validation-message').addClass('display-none');

      var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;

      if (key == 13) {
        e.preventDefault();
        this.requestResetToken();
      }
    },

    isValid: function() {
      var email = this.$('.input-username-email').val().trim();
      var valid = Helpers.isValidEmail(email);
      if (valid) {
        this.$('.input-username-email').addClass('input-error');
        this.$('.validation-message').removeClass('display-none');
      }
      return valid;
    },

    requestResetToken: function(e) {
      e && e.preventDefault();
      
      var self = this;

      if (self.isValid()) {
        var email = this.$('.input-username-email').val().trim();

        $.post ('/api/createtoken', {email: email},
          function(data, textStatus, jqXHR) {
            if (data.success) {
              self.$('.forgot-container').addClass('display-none');
              self.$('.forgot-password-success').removeClass('display-none');
            }
          }
          ).fail(function() {
            self.$('.input-username-email').addClass('input-error');
          });
      }
    }

  }, {
    template: 'forgotPassword'
  });

  return ForgotPasswordView;

});
