// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('core/app/origin');
  var SidebarItemView = require('core/sidebar/views/sidebarItemView');

  var EditorMenuSettingsEditSidebarView = SidebarItemView.extend({
    events: {
      'click .editor-menusettings-edit-sidebar-save': 'saveEditing'
    },

    saveEditing: function(event) {
      event && event.preventDefault();
      this.updateButton('.editor-menusettings-edit-sidebar-save', window.polyglot.t('app.saving'));
      Origin.trigger('editorMenuSettingsEditSidebar:views:save');
    }
  }, {
    template: 'editorMenuSettingsEditSidebar'
  });

  return EditorMenuSettingsEditSidebarView;
});
