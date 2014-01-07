define(function(require) {

  var Backbone = require('backbone');
  
  var LoginModel = Backbone.Model.extend({
    
    initialize: function() {
      console.log('login view created');
    },
    
    url:"/api/login"
    
  });
  
  return LoginModel;
  
})