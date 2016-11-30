define(function(require){
 var Backbone = require('backbone');

 var TenantModel = Backbone.Model.extend({
  idAttribute:'_id',

  initialize:function(){

  }
});

 return TenantModel;
});
