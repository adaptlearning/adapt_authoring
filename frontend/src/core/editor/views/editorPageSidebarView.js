define(function(require) {

	var Origin = require('coreJS/app/origin');
	var SidebarItemView = require('coreJS/sidebar/views/sidebarItemView');

	var EditorPageSidebarView = SidebarItemView.extend({

	}, {
		template: 'editorPageSidebar'
	});

	return EditorPageSidebarView;

});