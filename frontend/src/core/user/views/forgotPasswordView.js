define(function(require) {
  var Backbone = require('backbone');
  var OriginView = require('coreJS/app/views/originView');
  var ForgotPasswordView = OriginView.extend({

    tagName: "div",

    className: "forgot-password",

    events: {
      'click .form-forgot-password .submit':'emailSubmitted',
      'click .form-forgot-password .cancel':'gotoLogin'
    },

    postRender: function() {
      this.setViewToReady();
    },
    gotoLogin : function (e) {
      e.preventDefault();
      Backbone.history.navigate('#/user/login', {trigger: true});
    },
    emailSubmitted: function(e) {
      e.preventDefault();

      var email = this.$('.input-username-email').val();
      var model = this.model;
      var view = this;

      // Validation
      // maybe add check for valid email format (adapt@example.com)
      if (email === '') {
        $('#passwordErrorMessage').text(window.polyglot.t('app.pleaseenteremail'));
        return false;
      };

      // Display success regardless - we don't want to give them any clues :)
      view.$('.form-forgot-password').addClass('display-none');
      view.$('.success').removeClass('display-none');
      model.handleReset(email, function(err, res) {
        // do nothing.
      });     
    }

  }, {
    template: 'forgotPassword'
  });

  return ForgotPasswordView;

});
