// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('core/origin');
  var SidebarItemView = require('modules/sidebar/views/sidebarItemView');

  var EditorThemeEditSidebarView = SidebarItemView.extend({
    events: {
      'click .editor-theme-edit-sidebar-save': 'saveEditing'
    },

    saveEditing: function(event) {
      event && event.preventDefault();
      Origin.trigger('editorThemeEditSidebar:views:save');
    }
  }, {
    template: 'editorThemeEditSidebar'
  });

  return EditorThemeEditSidebarView;
});
