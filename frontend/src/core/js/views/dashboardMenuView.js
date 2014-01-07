define(["backbone", "handlebars"], function(Backbone, Handlebars){

  var DashboardMenuView = Backbone.View.extend({
    
    initialize: function() {
      this.render();
    },
    
    render: function() {
    
      var template = Handlebars.templates['dashboardMenu'];
      this.$el.html(template());
      return this;
      
    }
    
  });

  return DashboardMenuView;

});