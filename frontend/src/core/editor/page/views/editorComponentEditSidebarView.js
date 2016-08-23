// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
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
      this.updateButton('.editor-component-edit-sidebar-save', window.polyglot.t('app.saving'));
      Origin.trigger('editorComponentEditSidebar:views:save');
    },

    cancelEditing: function(event) {
      event.preventDefault();
      var currentCourseId = Origin.editor.data.course.get('_id');
      var currentPageId = this.model.getParent().getParent().getParent().get('_id');
      Origin.router.navigate('#/editor/' + currentCourseId + '/page/' + currentPageId);
      Origin.trigger('editingOverlay:views:hide');
    }

  }, {
    template: 'editorComponentEditSidebar'
  });

  return EditorComponentEditSidebarView;

});