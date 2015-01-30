define(function(require) {

  var Backbone = require('backbone');

  var ModalModel = Backbone.Model.extend({
    defaults: {
      _isActive:false
    }
  });

  return ModalModel;

});
