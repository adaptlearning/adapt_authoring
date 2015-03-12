// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
    
  var Origin = require('coreJS/app/origin');
  var SidebarItemView = require('coreJS/sidebar/views/sidebarItemView');
  var Backbone = require('backbone');

  var EditorThemeEditSidebarView = SidebarItemView.extend({

    events: {
        'click .editor-theme-edit-sidebar-save'     : 'saveEditing',
        'click .editor-theme-edit-sidebar-cancel'   : 'cancelEditing'
    },

    saveEditing: function(event) {
        event.preventDefault();

        Origin.trigger('editorThemeEditSidebar:views:save');
    },

    cancelEditing: function(event) {
        event.preventDefault();
        Backbone.history.history.back();
        Origin.trigger('editingOverlay:views:hide');
    }

  }, {
    template: 'editorThemeEditSidebar'
  });

  return EditorThemeEditSidebarView;

});