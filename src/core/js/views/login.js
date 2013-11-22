define(["backbone", "handlebars"], function(Backbone, Handlebars){

 var LoginView = Backbone.View.extend({
    tagName: "div",
    
    className: "test",
    events: {
      "click a#linkRegister" : "gotoRegister",
      "click a#linkForgotPassword" : "gotoForgotPassword"
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
    }
  });

  return LoginView;

});
