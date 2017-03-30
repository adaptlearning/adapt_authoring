define(['core/origin', './views/navigationView'], function(Origin, NavigationView) {
  Origin.once('app:dataReady', function() {
    $('#app').before(new NavigationView({ model: Origin.sessionModel }).$el);
  });
});
