define(function(require) {
  var Backbone = require('backbone'),
      Handlebars = require('handlebars'),
      jquery = require('jquery'),
      Template = require('text!templates/forgotPassword.tpl');

  var ForgotPasswordView = Backbone.View.extend({
    tagName: "div",
    
    className: "test",
    
    render: function() {
    
      var compiled = Handlebars.compile(Template);
      var html = compiled();
      this.$el.html(html);
      return this;
      
    }
  });

  return ForgotPasswordView;
});
