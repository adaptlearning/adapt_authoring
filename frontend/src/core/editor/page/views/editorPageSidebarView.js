define(function(require) {

  var Origin = require('coreJS/app/origin');
  var SidebarItemView = require('coreJS/sidebar/views/sidebarItemView');

  var EditorPageSidebarView = SidebarItemView.extend({
    
    events: {
        'click button.editor-page-sidebar-publish' : 'publishProject'
    },

    publishProject: function() {
        Origin.trigger('editorPageSidebarView:publish');
    }
  }, {
    template: 'editorPageSidebar'
  });

  return EditorPageSidebarView;

});