// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
    
    var Origin = require('coreJS/app/origin');
    var SidebarItemView = require('coreJS/sidebar/views/sidebarItemView');
    var Backbone = require('backbone');

    var EditorExtensionsEditSidebarView = SidebarItemView.extend({}, {
        template: 'editorExtensionsEditSidebar'
    });

    return EditorExtensionsEditSidebarView;

});