define(function(require) {

  var Origin = require('coreJS/app/origin');
  var SidebarItemView = require('coreJS/sidebar/views/sidebarItemView');

  var EditorPageSidebarView = SidebarItemView.extend({
    
    events: {
      'click button.editor-page-sidebar-publish' : 'publishProject',
      'click button.editor-page-sidebar-preview' : 'previewProject'
    },

    publishProject: function() {
      Origin.trigger('editorPageSidebarView:publish');
    },

    previewProject: function() {
      Origin.trigger('editorPageSidebarView:preview');
    }
  }, {
    template: 'editorPageSidebar'
  });

  return EditorPageSidebarView;

});