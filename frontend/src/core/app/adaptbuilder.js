define(function(require){

  var _ = require('underscore');
  var Backbone = require('backbone');

  var AdaptBuilder = {};

  _.extend(AdaptBuilder, Backbone.Events);

  AdaptBuilder.initialize = _.once(function() {
      AdaptBuilder.trigger('adaptbuilder:initialize');
      Backbone.history.start();
  });

  return AdaptBuilder;

});
