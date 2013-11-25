define(["backbone", "handlebars", "jquery", "coreJS/adaptbuilder"], function(Backbone, Handlebars, $, AdaptBuilder){

 var LoginView = Backbone.View.extend({

    initialize: function() {
      this.listenTo(AdaptBuilder, 'loginFailed', this.loginFailed);
    },

    tagName: "div",
     
    className: "login",

    events: {
      "click a#linkRegister" : "gotoRegister",
      "click a#linkForgotPassword" : "gotoForgotPassword",
      "click button":"submitLoginDetails"
    },
    
    render: function() {
      var template = Handlebars.templates['login'];
      this.$el.html(template());
      return this;
    },

    gotoForgotPassword: function(e) {
      e.preventDefault();
      Backbone.history.navigate('/login/forgot', {trigger: true});
    },

    gotoRegister: function(e) {
      e.preventDefault();
      Backbone.history.navigate('/register', {trigger: true});
    },

    submitLoginDetails: function(e) {
      e.preventDefault();
      // Do some crazy validation here
      var inputUsernameEmail = $("#inputUsernameEmail", this.$el).val();
      var inputPassword = $("#inputPassword", this.$el).val();
      
      $.post(
        '/api/login',
        {
          email:inputUsernameEmail,
          password:inputPassword
        },
        function(authenticated) {
          if (authenticated.success) {
            Backbone.history.navigate('/dashboard', {trigger: true});
          } else {
             AdaptBuilder.trigger('loginFailed');
          }
      }).fail(function() {
        AdaptBuilder.trigger('loginFailed');
      });
    },
   
    loginFailed: function() {
      $('#loginFailed').removeClass('hide');
    }

  });

  return LoginView;

});
