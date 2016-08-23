// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
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
      var regEx = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

      if (email.length == 0 || !regEx.test(email)) {
        this.$('.input-username-email').addClass('input-error');
        this.$('.validation-message').removeClass('display-none');
        return false;
      } else {
        return true;
      }
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
