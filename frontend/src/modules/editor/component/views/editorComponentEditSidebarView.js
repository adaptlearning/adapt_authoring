// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('core/origin');
  var SidebarItemView = require('modules/sidebar/views/sidebarItemView');

  var EditorComponentEditSidebarView = SidebarItemView.extend({
    events: {
      'click .editor-component-edit-sidebar-save': 'saveEditing',
      'click .editor-component-edit-sidebar-cancel': 'cancelEditing'
    },

    saveEditing: function(event) {
      event.preventDefault();
      this.updateButton('.editor-component-edit-sidebar-save', Origin.l10n.t('app.saving'));
      Origin.trigger('editorComponentEditSidebar:views:save');
    },

    cancelEditing: function(event) {
      event.preventDefault();
      var currentCourseId = Origin.editor.data.course.get('_id');
      var currentPageId = this.model.getParent().getParent().getParent().get('_id');
      Origin.router.navigateTo('editor/' + currentCourseId + '/page/' + currentPageId);
    }
  }, {
    template: 'editorComponentEditSidebar'
  });

  return EditorComponentEditSidebarView;
});
