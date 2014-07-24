define(function(require) {
    
    var Origin = require('coreJS/app/origin');
    var SidebarItemView = require('coreJS/sidebar/views/sidebarItemView');
    var Backbone = require('backbone');

    var EditorExtensionsEditSidebarView = SidebarItemView.extend({

        events: {
            'click .editor-extensions-edit-sidebar-save': 'saveEditing',
            'click .editor-extensions-edit-sidebar-cancel': 'cancelEditing'
        },

        saveEditing: function(event) {
            event.preventDefault();

            Origin.trigger('editorExtensionsEditSidebar:views:confirmSave');
        },

        cancelEditing: function(event) {
            event.preventDefault();
            Backbone.history.history.back();
            Origin.trigger('editingOverlay:views:hide');
        }

    }, {
        template: 'editorExtensionsEditSidebar'
    });

    return EditorExtensionsEditSidebarView;

});