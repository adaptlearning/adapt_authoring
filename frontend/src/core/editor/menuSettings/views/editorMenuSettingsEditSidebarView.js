define(function(require) {

  var Origin = require('coreJS/app/origin');
  var SidebarItemView = require('coreJS/sidebar/views/sidebarItemView');
  var Backbone = require('backbone');

  var EditorMenuSettingsEditSidebarView = SidebarItemView.extend({

    events: {
        'click .editor-menusettings-edit-sidebar-save' : 'saveEditing',
        'click .editor-menusettings-edit-sidebar-cancel' : 'cancelEditing'

    },

    saveEditing: function(event) {
        event.preventDefault();
        this.updateButton('.editor-menusettings-edit-sidebar-save', window.polyglot.t('app.saving'));
        Origin.trigger('editorMenuSettingsEditSidebar:views:save');
    },

    cancelEditing: function(event) {
        event.preventDefault();
        Backbone.history.history.back();
        Origin.trigger('editingOverlay:views:hide');
    }

  }, {
    template: 'editorMenuSettingsEditSidebar'

  });

  return EditorMenuSettingsEditSidebarView;

});