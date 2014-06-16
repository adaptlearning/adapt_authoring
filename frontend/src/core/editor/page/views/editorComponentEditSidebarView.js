define(function(require) {
    
    var Origin = require('coreJS/app/origin');
    var SidebarItemView = require('coreJS/sidebar/views/sidebarItemView');
    var Backbone = require('backbone');

    var EditorComponentEditSidebarView = SidebarItemView.extend({

        events: {
            'click .editor-component-edit-sidebar-save': 'saveEditing',
            'click .editor-component-edit-sidebar-cancel': 'cancelEditing'
        },

        saveEditing: function(event) {
            event.preventDefault();
            Origin.trigger('editorComponentEditSidebar:views:save');
        },

        cancelEditing: function(event) {
            event.preventDefault();
            Backbone.history.history.back();
            Origin.trigger('editingOverlay:views:hide');
        }

    }, {
        template: 'editorComponentEditSidebar'
    });

    return EditorComponentEditSidebarView;

});