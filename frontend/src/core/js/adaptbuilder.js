define(["underscore", "backbone"], function(_, Backbone){

  var AdaptBuilder = {};

  _.extend(AdaptBuilder, Backbone.Events);

  AdaptBuilder.initialize = _.once(function() {
      AdaptBuilder.trigger('adaptbuilder:initialize');
      Backbone.history.start();
  });

  //@todo remove these examples
  AdaptBuilder.on('login:changed', function(e){
    console.log('Broad login detected :: ' + e.authenticated);
  });
  AdaptBuilder.on('login:loggedin', function(e){
    console.log('loggedin detected');
  });
  AdaptBuilder.on('login:loggedout', function(e){
    console.log('loggedout detected');
  });

  return AdaptBuilder;
});