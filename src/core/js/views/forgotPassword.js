define(["backbone", "handlebars"], function(Backbone, Handlebars){

  var ForgotPasswordView = Backbone.View.extend({
    tagName: "div",
    
    className: "test",
    
    render: function() {
    
      var template = Handlebars.templates['forgotPassword'];
      this.$el.html(template());
      return this;
      
    }
  });

  return ForgotPasswordView;

});
