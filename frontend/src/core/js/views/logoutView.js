define(function(require) {
  var Backbone = require('backbone'),
      Handlebars = require('handlebars'),
      $ = require('jquery'),
      AdaptBuilder = require('coreJS/adaptbuilder');

 var LogoutView = Backbone.View.extend({

    initialize: function() { },

    tagName: "div",
     
    className: "logout",

    events: {
      "click a#linkLogout" : "completeLogout",
      "click a#linkDash" : "gotoDashboard"
    },
    
    render: function() {
      //update the model
      this.model.fetch();
      
      var template = Handlebars.templates['logout'];
      this.$el.html(template(this.model.toJSON()));
      return this;
    },

    completeLogout: function(e) {
      e.preventDefault();
      
      this.model.logout(function(){
        Backbone.history.navigate('/', {trigger: true});
      });
    },
    
    gotoDashboard: function () {
      Backbone.history.navigate('/dashboard', {trigger: true});
    }

  });

  return LogoutView;

});