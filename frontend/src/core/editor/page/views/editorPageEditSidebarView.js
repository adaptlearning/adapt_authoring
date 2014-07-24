define(function(require) {
    
    var Origin = require('coreJS/app/origin');
    var SidebarItemView = require('coreJS/sidebar/views/sidebarItemView');
    var Backbone = require('backbone');

    var EditorPageEditSidebarView = SidebarItemView.extend({

        events: {
            'click .editor-page-edit-sidebar-save': 'saveEditing',
            'click .editor-page-edit-sidebar-cancel': 'cancelEditing'
        },

        saveEditing: function(event) {
            event.preventDefault();
            Origin.trigger('editorPageEditSidebar:views:save');
        },

        cancelEditing: function(event) {
            event.preventDefault();
            Backbone.history.history.back();
            Origin.trigger('editingOverlay:views:hide');
        }

    }, {
        template: 'editorPageEditSidebar'
    });

    return EditorPageEditSidebarView;

});