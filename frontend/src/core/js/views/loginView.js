define(function(require) {
  var Backbone = require('backbone'),
      Handlebars = require('handlebars'),
      $ = require('jquery'),
      AdaptBuilder = require('coreJS/adaptbuilder');

 var LoginView = Backbone.View.extend({

    initialize: function() {
      this.listenTo(AdaptBuilder, 'loginFailed', this.loginFailed);
    },

    tagName: "div",
     
    className: "login",

    events: {
      "click a#linkDash" : "gotoDashboard",
      "click a#linkRegister" : "gotoRegister",
      "click a#linkForgotPassword" : "gotoForgotPassword",
      "click button":"submitLoginDetails"
    },
    
    render: function() {
      //update the model
      this.model.fetch();
      
      var template = Handlebars.templates.login;
      this.$el.html(template(this.model.toJSON()));
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
      var mdl = this.model;
      
      $.post(
        '/api/login',
        {
          email:inputUsernameEmail,
          password:inputPassword
        },
        function(authenticated) {
          mdl.fetch();
          if (authenticated.success) {
            Backbone.history.navigate('/dashboard', {trigger: true});
          } else {
             AdaptBuilder.trigger('loginFailed');
          }
      }).fail(function() {
        AdaptBuilder.trigger('loginFailed');
      });
    },
   
    gotoDashboard: function () {
      e.preventDefault(); 
      Backbone.history.navigate('/dashboard', {trigger: true});
    },
   
    loginFailed: function() {
      $('#loginFailed').removeClass('hide');
    }

  });

  return LoginView;

});
