// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

    var Origin = require('coreJS/app/origin');
    var LocationTitleView = require('coreJS/location/views/locationTitleView');

    Origin.once('app:dataReady', function() {
        $('.location-title').html(new LocationTitleView().$el);
    });

})