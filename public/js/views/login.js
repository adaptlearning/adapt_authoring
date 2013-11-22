define(function(require) {
  var Backbone = require('backbone'),
      Handlebars = require('handlebars'),
      jquery = require('jquery'),
      Template = require('text!templates/login.tpl');

  var LoginView = Backbone.View.extend({
    tagName: "div",
    
    className: "test",
    events: {
      "click a#linkRegister" : "gotoRegister",
      "click a#linkForgotPassword" : "gotoForgotPassword"
    },
    
    render: function() {
    
      var compiled = Handlebars.compile(Template);
      var html = compiled();
      this.$el.html(html);
      return this;
      
    },

    gotoForgotPassword: function(e) {
      e.preventDefault();
      Backbone.history.navigate('/login/forgot', {trigger: true});
    },

    gotoRegister: function(e) {
      e.preventDefault();
      Backbone.history.navigate('/register', {trigger: true});
    }
  });

  return LoginView;
});
