define(function(require) {
  var Backbone = require('backbone');
  var OriginView = require('coreJS/app/views/originView');

  var ResetPasswordView = OriginView.extend({
    
    tagName: "div",

    className: "reset-password",

    events: {
      'click .form-reset-password button':'resetPassword'
    },

    preRender: function() {
      this.listenTo(this.model, 'sync', this.verifyToken);
    },

    verifyToken: function() {
      if (!this.model.get('user')) {
        // Invalid token entered - Route user back to login
        Backbone.history.navigate('#/user/login', {trigger: true});
      }
    },

    resetPassword: function(e) {
      e.preventDefault();
      
      var inputPassword = this.$('.input-new-password').val();
      var model = this.model;
      var view = this;

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
