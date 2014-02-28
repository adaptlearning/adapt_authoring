define(function(require) {

	var AdaptBuilder = require('coreJS/app/adaptBuilder');
	var BuilderView = require('coreJS/app/views/builderView');

	var EditorSidebarView = BuilderView.extend({

		className: 'editor-sidebar',

		preRender: function() {
			this.listenTo(AdaptBuilder, 'editorSidebar:addEditView', this.addEditingView);
		},

		addEditingView: function() {
			console.log('adding editing view');
		}

	}, {
		template:'editorSidebar'
	});

	return EditorSidebarView;

})