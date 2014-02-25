define(function(require) {

	var AdaptBuilder = require('coreJS/app/adaptBuilder');
	var BuilderView = require('coreJS/app/views/builderView');

	var EditorSidebarView = BuilderView.extend({

		className: 'editor-sidebar'

	}, {
		template:'editorSidebar'
	});

	return EditorSidebarView;

})