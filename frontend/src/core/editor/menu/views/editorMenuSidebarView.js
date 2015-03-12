// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

    var Origin = require('coreJS/app/origin');
    var SidebarItemView = require('coreJS/sidebar/views/sidebarItemView');

    var EditorMenuSidebarView = SidebarItemView.extend({

      // If adding 'events', extend from the base view
      
    }, {
        template: 'editorMenuSidebar'
    });

    return EditorMenuSidebarView;

});
