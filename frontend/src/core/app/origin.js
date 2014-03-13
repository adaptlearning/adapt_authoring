define(function(require){

  var _ = require('underscore');
  var Backbone = require('backbone');

  var Origin = {};

  _.extend(Origin, Backbone.Events);

  Origin.initialize = _.once(function() {
      Origin.trigger('origin:initialize');
      Backbone.history.start();
  });

  Origin.editor = {};

  Origin.editor.data = {};

  return Origin;

});
