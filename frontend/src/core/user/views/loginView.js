define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');

  var LoginView = OriginView.extend({

    className: 'login',

    tagName: "div",

    events: {
      'click .login-form button':'submitLoginDetails'
    },

    preRender: function() {
      this.listenTo(Origin, 'loginFailed', this.loginFailed, this);
    },
    
    submitLoginDetails: function(e) {
      e.preventDefault();
      var inputUsernameEmail = this.$("#login-input-username").val();
      var inputPassword = this.$("#login-input-password").val();
      var mdl = this.model;

      mdl.login(inputUsernameEmail, inputPassword, function(err, result){
        if( err || !result.success) {
          Origin.trigger('loginFailed');
        } else {
          Backbone.history.navigate('#/dashboard', {trigger: true});
        }
      });
    },

    loginFailed: function() {
      $('#loginFailed').removeClass('hide');
    }

  }, {
    template: 'login'
  });

  return LoginView;

});
