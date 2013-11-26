define(["backbone", "handlebars"], function(Backbone, Handlebars){

  var NavigationView = Backbone.View.extend({
    
    initialize: function() {
      this.render();
    },
    
    render: function() {
    
      var template = Handlebars.templates['navigation'];
      $('#nav').html(template);
      return this;
      
    }
    
  });

  return new NavigationView;

});
