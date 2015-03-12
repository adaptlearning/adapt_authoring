// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

    var Origin = require('coreJS/app/origin');
    var SidebarContainerView = require('coreJS/sidebar/views/sidebarView');

    var Sidebar = {};

    Sidebar.addView = function($el, options) {
        // Trigger to remove current views
        Origin.trigger('sidebar:views:remove');

        // Check if element is a view element
        if (_.isElement($el[0]) !== true) {
            return console.log("Sidebar - Cannot add this object to the sidebar view. Please make sure it's the views $el");
        }

        // Trigger update of views
        Origin.trigger('sidebar:sidebarContainer:update', $el, options);

    }

    // Append sidebar to body
    Origin.once('app:dataReady', function() {
        $('body').append(new SidebarContainerView().$el);
    });

    // Push sidebar to Origin object
    Origin.sidebar = Sidebar;

})