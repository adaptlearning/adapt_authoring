// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var LocationTitleView = require('./views/locationTitleView');

  Origin.once('origin:dataReady', function() {
    $('.location-title').html(new LocationTitleView().$el);
  });
})
