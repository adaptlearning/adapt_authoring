// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('core/app/origin');
  var SidebarItemView = require('core/sidebar/views/sidebarItemView');

  var EditorThemeCollectionSidebarView = SidebarItemView.extend({
    events: {
      'click .editor-theme-edit-sidebar-save': 'saveEditing',
      'click .editor-theme-edit-sidebar-cancel': 'cancelEditing'
    },

    saveEditing: function(event) {
      event && event.preventDefault();
      this.updateButton('.editor-theme-edit-sidebar-save', window.polyglot.t('app.saving'));
      Origin.trigger('editorThemeEditSidebar:views:save');
    },

    cancelEditing: function(event) {
      event && event.preventDefault();
      Backbone.history.history.back();
    }
  }, {
    template: 'editorThemeCollectionSidebar'
  });

  return EditorThemeCollectionSidebarView;
});
