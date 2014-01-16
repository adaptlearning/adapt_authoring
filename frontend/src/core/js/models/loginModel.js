define(function(require) {

  var Backbone = require('backbone'),
      AdaptBuilder = require('coreJS/adaptbuilder');
  
  
  var LoginModel = Backbone.Model.extend({
    
    defaults: {
      authenticated: false 
    },
    
    initialize: function() {
      this.listenTo(this, 'change:authenticated', this.authChange);
    },
                                         
    authChange: function(context, newVal) {
      AdaptBuilder.trigger('login:changed',{authenticated:newVal});
      if(true === newVal){
        AdaptBuilder.trigger('login:loggedin');
      }else{
        AdaptBuilder.trigger('login:loggedout',newVal); 
      }
    },
    
    logout: function (cback) {
      var mdl = this;
      $.post('/api/logout',function(){
        //mdl.fetch(); @todo timing issue
        mdl.set('authenticated', false);
      }).always(cback);
    },
        
    url:"/api/authcheck"
    
  });
  
  return LoginModel;
  
})