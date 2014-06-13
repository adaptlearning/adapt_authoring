define(function(require) {

    var Origin = require('coreJS/app/origin');
    var LocationTitleView = require('coreJS/location/views/locationTitleView');

    Origin.once('app:dataReady', function() {
        $('.location-title').html(new LocationTitleView().$el);
    });

})