define(function(require) {
  var Backbone = require('backbone'),
      Handlebars = require('handlebars'),
      jquery = require('jquery'),
      Template = require('text!templates/home.tpl');

  var HomeView = Backbone.View.extend({
    tagName: "div",
    
    className: "test",
    events: {
      'click a' : 'gotoLogin'
    },
    
    render: function() {
    
      var compiled = Handlebars.compile(Template);
      var html = compiled({something: "here"});
      this.$el.html(html);
      return this;
      
    },

    gotoLogin: function(e) {
      e.preventDefault();
      Backbone.history.navigate('/login', {trigger: true});
    }
  });

  return HomeView;
});
