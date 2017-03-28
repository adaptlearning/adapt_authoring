// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/app/origin');
  var LocationTitleView = require('core/location/views/locationTitleView');

  Origin.once('app:dataReady', function() {
    $('.location-title').html(new LocationTitleView().$el);
  });
})
