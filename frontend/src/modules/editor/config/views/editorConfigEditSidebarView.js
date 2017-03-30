// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('core/origin');
  var SidebarItemView = require('modules/sidebar/views/sidebarItemView');

  var EditorConfigEditSidebarView = SidebarItemView.extend({
    events: {
      'click .editor-config-edit-sidebar-save': 'saveEditing',
      'click .editor-config-edit-sidebar-cancel': 'cancelEditing'
    },

    saveEditing: function(event) {
      event && event.preventDefault();
      this.updateButton('.editor-config-edit-sidebar-save', Origin.l10n.t('app.saving'));
      Origin.trigger('editorConfigEditSidebar:views:save');
    },

    cancelEditing: function(event) {
      event && event.preventDefault();
      Backbone.history.history.back();
    }
  }, {
    template: 'editorConfigEditSidebar'
  });

  return EditorConfigEditSidebarView;
});
