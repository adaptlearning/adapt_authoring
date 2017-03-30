// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('core/origin');
  var SidebarItemView = require('modules/sidebar/views/sidebarItemView');

  var EditorPageEditSidebarView = SidebarItemView.extend({
    events: {
      'click .editor-page-edit-sidebar-save': 'saveEditing',
      'click .editor-page-edit-sidebar-cancel': 'cancelEditing'
    },

    saveEditing: function(event) {
      event && event.preventDefault();
      this.updateButton('.editor-page-edit-sidebar-save', Origin.l10n.t('app.saving'))
      Origin.trigger('editorPageEditSidebar:views:save');
    },

    cancelEditing: function(event) {
      event && event.preventDefault();
      Backbone.history.history.back();
    }
  }, {
    template: 'editorPageEditSidebar'
  });

  return EditorPageEditSidebarView;
});
