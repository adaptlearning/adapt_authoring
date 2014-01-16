define(["backbone", "handlebars"], function(Backbone, Handlebars){

  var AdaptBuilder = require('coreJS/adaptbuilder');
 
  var NavigationView = Backbone.View.extend({
    
    initialize: function() {
      
      this.listenTo(AdaptBuilder, 'login:changed', this.loginChanged);
      this.listenTo(AdaptBuilder, 'route:changed', this.routeChanged);
      
    },
    
    loginChanged: function (ev) {
      this.$('.navbar-right').html(Handlebars.partials['part_loginStatus']({
        loggedin:ev.authenticated
      }));
      
      this.$('#nav-left').html(Handlebars.partials['part_navigation_top']({
        loggedin:ev.authenticated
      }));
      
    },
    
    routeChanged: function ( info ) {
      
      console.log('Route changed ' + info.route);
      
      this.$('.active').removeClass('active');
      this.$('li[data-route="' + info.route + '"]').addClass('active');
      
    },
    
    render: function() {
    
      var template = Handlebars.templates['navigation'];
      this.$el.html(template);
      
      this.routeChanged({route:'index'});
      
      return this;
    }
            
  });

  return NavigationView;

});
