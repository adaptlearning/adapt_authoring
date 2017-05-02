// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('core/origin');
  var SidebarItemView = require('modules/sidebar/views/sidebarItemView');

  var EditorCourseEditSidebarView = SidebarItemView.extend({
    events: {
      'click .editor-project-edit-sidebar-save': 'save',
      'click .editor-project-edit-sidebar-cancel': 'cancel'
    },

    save: function(event) {
      event && event.preventDefault();
      this.updateButton('.editor-project-edit-sidebar-save', Origin.l10n.t('app.saving'));
      Origin.trigger('projectEditSidebar:views:save');
    },

    cancel: function(event) {
      event && event.preventDefault();
      Backbone.history.history.back();
    }
  }, {
    template: 'editorCourseEditSidebar'
  });

  return EditorCourseEditSidebarView;
});
