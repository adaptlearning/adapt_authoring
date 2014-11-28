define(function(require) {
  var Backbone = require('backbone');
  var OriginView = require('coreJS/app/views/originView');

  var ResetPasswordView = OriginView.extend({
    
    tagName: "div",

    className: "reset-password",

    events: {
      'click .form-reset-password .submit':'checkPassword',
      'click .form-reset-password .cancel':'gotoLogin'
    },
    postRender: function() {
      this.setViewToReady();
      this.model.validateToken(function(result){
        if(!result.success){
          Backbone.history.navigate('#/user/notify', {trigger: true});

        }
      });

    },
    gotoLogin : function (e) {
      e.preventDefault();
      Backbone.history.navigate('#/user/login', {trigger: true});
    },
    checkPassword: function(e) {
      e.preventDefault();

      var inputPassword = this.$('.input-new-password').val();
      var confirmPassword = this.$('.input-new-password-confirm').val();
      var model = this.model;
      var view = this;

      // Check if passwords are not empty and match and have required length
      // Reuse validation from userProfileModel
      var validationResult = model.validatePassword(inputPassword, confirmPassword);

      view.$('#passwordErrorMessage').text("").addClass('display-none');
      view.$('#confirmPasswordErrorMessage').text("").addClass('display-none');

      if(validationResult !== null){

        if(validationResult.password){
          view.$('#passwordErrorMessage').text(validationResult.password).removeClass('display-none');
        }
        if(validationResult.confirmPassword){
          view.$('#confirmPasswordErrorMessage').text(validationResult.confirmPassword).removeClass('display-none');
        }
          
      }else{
        model.resetPassword(inputPassword, function(result) {

          if( result.error || !result.success) {
            view.$('.error').removeClass('display-none');
            Backbone.history.navigate('#/user/notify', {trigger: true});
          } else {
            view.$('.form-reset-password').addClass('display-none');
            view.$('.success').removeClass('display-none');
            Backbone.history.navigate('#/user/login', {trigger: true});
          }//else
        }); //model.resetPAssword
      } //else
        
      }// checkPassword

  }, {
    template: 'resetPassword'
  });

  return ResetPasswordView;

});
