define(function(require) {
  var Backbone = require('backbone');
  var OriginView = require('coreJS/app/views/originView');
  var ForgotPasswordView = OriginView.extend({

    tagName: "div",

    className: "forgot-password",

    events: {
      'click .form-forgot-password .submit':'emailSubmitted'
    },

  postRender: function() {
      this.setViewToReady();
    },

     emailEmpty: function() {
      $('#passwordErrorMessage').text(window.polyglot.t('app.pleaseenteremail'));
    },


    emailSubmitted: function(e) {
      e.preventDefault();

      var email = this.$('.input-username-email').val();
      var model = this.model;
      var view = this;

      // Validation
      if (email === '') {
        this.emailEmpty();
        return false;
      };



      // Display success regardless - we don't want to give them any clues :)
      view.$('.form-forgot-password').addClass('display-none');
      view.$('.success').removeClass('display-none');

      model.handleReset(email, function(err, result) {
      });     
    }

  }, {
    template: 'forgotPassword'
  });

  return ForgotPasswordView;

});
