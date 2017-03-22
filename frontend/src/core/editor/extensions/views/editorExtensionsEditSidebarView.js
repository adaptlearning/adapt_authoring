// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var SidebarItemView = require('coreJS/sidebar/views/sidebarItemView');

  var EditorExtensionsEditSidebarView = SidebarItemView.extend({}, {
    template: 'editorExtensionsEditSidebar'
  });

  return EditorExtensionsEditSidebarView;
});
