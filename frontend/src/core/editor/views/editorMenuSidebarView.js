define(function(require) {

	var Origin = require('coreJS/app/origin');
	var SidebarItemView = require('coreJS/sidebar/views/sidebarItemView');

	var EditorMenuSidebarView = SidebarItemView.extend({

	}, {
		template: 'editorMenuSidebar'
	});

	return EditorMenuSidebarView;

});