define(function(require) {

    var Origin = require('coreJS/app/origin');
    var SiderbarContainerView = require('coreJS/sidebar/views/sidebarView');
    console.log(Origin);

    var Sidebar = {};

    Sidebar.addView = function($el, options) {
        // Check if element is a view element
        if (_.isElement($el[0]) !== true) {
            return console.log("Sidebar - Cannot add this object to the sidebard view. Please make sure it's the views $el");
        }

        console.log($el);
        // Trigger to remove current views
        Origin.trigger('sidebar:views:remove');

        Origin.trigger('sidebar:sidebarContainer:update', options);

    }

    Origin.once('app:dataReady', function() {
        $('body').append(new SiderbarContainerView().$el);
    })

    // Added for testing purposes
    var SidebarItemView = require('coreJS/sidebar/views/sidebarItemView');
    Origin.once('origin:initialize', function() {
        /*Sidebar.addView(new SidebarItemView().$el, {
            'backButtonText': 'Back to courses',
            'backButtonRoute': '/#/dashboard'
        });*/
    })

    

})