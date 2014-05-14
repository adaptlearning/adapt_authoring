define(function(require) {
  var Backbone = require('backbone');
  var OriginView = require('coreJS/app/views/originView');

  var ForgotPasswordView = OriginView.extend({
    
    tagName: "div",

    className: "forgot-password",

    events: {
      'click .form-forgot-password .submit':'requestResetToken'
    },

    requestResetToken: function(e) {
      e.preventDefault();

      var email = this.$('.input-username-email').val();
      var model = this.model;
      var view = this;

      model.generateResetToken(email, function(err, result) {
        // Display success regardless - we don't want to give them any clues :)
        view.$('.form-forgot-password').addClass('display-none');
        view.$('.success').removeClass('display-none');
      });
    }

  }, {
    template: 'forgotPassword'
  });

  return ForgotPasswordView;

});
