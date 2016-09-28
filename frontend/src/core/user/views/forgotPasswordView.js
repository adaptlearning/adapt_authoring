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
      'click button.return' : 'goToLogin',
      'keydown .input-username-email' : 'handleKeydown'
    },

    postRender: function() {
      this.setViewToReady();
    },

    goToLogin: function(e) {
      e && e.preventDefault();
      Origin.router.navigate('#/user/login', {trigger: true});
    },

    handleKeydown: function(e) {
      this.$('.forgotError').addClass('display-none');

      var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;

      if (key == 13) {
        e.preventDefault();
        this.requestResetToken();
      }
    },

    isValid: function() {
      var email = this.$('.input-username-email').val().trim();
      return Helpers.isValidEmail(email);
    },

    requestResetToken: function(e) {
      e && e.preventDefault();
      var self = this;

      if (!this.isValid()) {
        this.$('.input-username-email').addClass('input-error');
        this.$('.forgotError').removeClass('display-none');
      } else {
        var email = this.$('.input-username-email').val().trim();
        $.post('/api/createtoken', { email: email });

        // don't wait for a response, we want to disguise success/failure
        self.$('.forgot-container').addClass('display-none');
        self.$('.forgot-password-success').removeClass('display-none');
      }
    }
  }, {
    template: 'forgotPassword'
  });

  return ForgotPasswordView;

});
