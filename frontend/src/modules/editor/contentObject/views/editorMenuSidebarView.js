// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/app/origin');
  var SidebarItemView = require('core/sidebar/views/sidebarItemView');

  var EditorMenuSidebarView = SidebarItemView.extend({
    // If adding 'events', extend from the base view
  }, {
    template: 'editorMenuSidebar'
  });

  return EditorMenuSidebarView;
});
