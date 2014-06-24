define(function(require) {

    var Origin = require('coreJS/app/origin');
    var SidebarItemView = require('coreJS/sidebar/views/sidebarItemView');

    var EditorMenuSidebarView = SidebarItemView.extend({

      events: {
        'click button.editor-menu-sidebar-publish' : 'publishProject',
        'click button.editor-menu-sidebar-preview' : 'previewProject'
      },

      publishProject: function() {
        Origin.trigger('editorMenuSidebarView:publish');
      },

      previewProject: function() {
        Origin.trigger('editorMenuSidebarView:preview');
      }

    }, {
        template: 'editorMenuSidebar'
    });

    return EditorMenuSidebarView;

});
