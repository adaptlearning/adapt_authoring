define(["backbone", "handlebars"], function(Backbone, Handlebars){

  var HomeView = Backbone.View.extend({
    tagName: "div",
    
    className: "test",
    events: {
      'click a' : 'gotoLogin'
    },
    
    render: function() {
    
      var template = Handlebars.templates['home'];
      this.$el.html(template());
      return this;
      
    },

    gotoLogin: function(e) {
      e.preventDefault();
      Backbone.history.navigate('/login', {trigger: true});
    }
  });

  return HomeView;

});
