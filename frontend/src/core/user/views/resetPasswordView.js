define(function(require) {
  var Backbone = require('backbone');
  var OriginView = require('coreJS/app/views/originView');

  var ResetPasswordView = OriginView.extend({
    
    tagName: "div",

    className: "reset-password",

    events: {
      'click .form-reset-password button':'checkPassword'
    },
  postRender: function() {
      this.setViewToReady();
    },


    checkPassword: function(e) {
      console.log("Call of checkPassword function: " + new Date().getMilliseconds()); 
      e.preventDefault();
      
      var inputPassword = this.$('.input-new-password').val();
      var confirmPassword = this.$('input-new-password-confirm').val();
      var model = this.model;
      var view = this;

      // Check if passwords are not empty and match and have required length
      // Reuse validation from userProfileModel


      model.resetPassword(inputPassword, function(err, result) {
        if( err || !result.success) {
          view.$('.error').removeClass('display-none');
        } else {
          view.$('.form-reset-password').addClass('display-none');
          view.$('.success').removeClass('display-none');
        }
      });
    }

  }, {
    template: 'resetPassword'
  });

  return ResetPasswordView;

});
