// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('core/origin');
  var SidebarItemView = require('modules/sidebar/views/sidebarItemView');

  var EditorMenuSettingsEditSidebarView = SidebarItemView.extend({
    events: {
      'click .editor-menusettings-edit-sidebar-save': 'saveEditing'
    },

    saveEditing: function(event) {
      event && event.preventDefault();
      this.updateButton('.editor-menusettings-edit-sidebar-save', Origin.l10n.t('app.saving'));
      Origin.trigger('editorMenuSettingsEditSidebar:views:save');
    }
  }, {
    template: 'editorMenuSettingsEditSidebar'
  });

  return EditorMenuSettingsEditSidebarView;
});
