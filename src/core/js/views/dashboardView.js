define(["backbone", "handlebars"], function(Backbone, Handlebars){

  var DashboardView = Backbone.View.extend({
    
    tagName: "div",
    
    className: "dashboard",
    
    render: function() {
    
      var template = Handlebars.templates['dashboard'];
      this.$el.html(template());
      return this;
      
    }
    
  });

  return DashboardView;

});
