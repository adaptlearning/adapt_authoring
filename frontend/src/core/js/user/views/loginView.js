define(function(require) {
  var Backbone = require('backbone');
  var AdaptBuilder = require('coreJS/adaptbuilder');
  var BuilderView = require('coreJS/core/views/builderView');

  var LoginView = BuilderView.extend({

    className: 'login-view',

    tagName: "div",

    events: {
      'click .loginForm button':'submitLoginDetails'
    },

    preRender: function() {
      this.listenTo(AdaptBuilder, 'loginFailed', this.loginFailed);
    },
    
    submitLoginDetails: function(e) {
      e.preventDefault();
      //Do some crazy validation here
      var inputUsernameEmail = $("#inputUsernameEmail", this.$el).val();
      var inputPassword = $("#inputPassword", this.$el).val();
      var mdl = this.model;

      mdl.login(inputUsernameEmail, inputPassword, function(err, result){
        if( err || !result.success) {
          AdaptBuilder.trigger('loginFailed');
        } else {
          Backbone.history.navigate('#dashboard', {trigger: true});
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
