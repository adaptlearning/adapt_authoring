// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var LocationView = require('./views/locationView');

  Origin.once('origin:dataReady', function() {
    $('.location-title').html(new LocationView().$el);
  });
})
