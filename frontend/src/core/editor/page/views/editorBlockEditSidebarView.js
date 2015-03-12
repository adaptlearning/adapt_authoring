// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
    
    var Origin = require('coreJS/app/origin');
    var SidebarItemView = require('coreJS/sidebar/views/sidebarItemView');
    var Backbone = require('backbone');

    var EditorBlockEditSidebarView = SidebarItemView.extend({

        events: {
            'click .editor-block-edit-sidebar-save': 'saveEditing',
            'click .editor-block-edit-sidebar-cancel': 'cancelEditing'
        },

        saveEditing: function(event) {
            event.preventDefault();
            this.updateButton('.editor-block-edit-sidebar-save', window.polyglot.t('app.saving'));
            Origin.trigger('editorBlockEditSidebar:views:save');
        },

        cancelEditing: function(event) {
            event.preventDefault();
            Backbone.history.history.back();
            Origin.trigger('editingOverlay:views:hide');
        }

    }, {
        template: 'editorBlockEditSidebar'
    });

    return EditorBlockEditSidebarView;

});