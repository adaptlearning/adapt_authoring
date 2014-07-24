define(function(require){

  var _ = require('underscore');
  var Backbone = require('backbone');

  var Origin = {};

  _.extend(Origin, Backbone.Events);

  Origin.initialize = _.once(function() {
      Origin.trigger('origin:initialize');
      Backbone.history.start();
      Origin.trigger('origin:hideLoading');
  });

  Origin.editor = {};

  Origin.editor.data = {};

  Origin.location = {};

  // Push sockets onto Origin object
  Origin.socket = io.connect();

  return Origin;

});
