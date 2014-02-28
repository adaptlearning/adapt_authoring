define(function(require) {

	var AdaptBuilder = require('coreJS/app/adaptBuilder');
	var BuilderView = require('coreJS/app/views/builderView');

	var EditorSidebarView = BuilderView.extend({

		className: 'editor-sidebar',

		preRender: function() {
			this.listenTo(AdaptBuilder, 'editorSidebar:addEditView', this.addEditingView);
		},

		addEditingView: function(view) {
			this.hideLoadingStatus();
			this.hideInstruction();
			this.$('.editor-sidebar-inner').append(view);
			console.log('adding editing view');
		},

		hideLoadingStatus: function() {
			this.$('.editor-sidebar-loading').addClass('display-none');
		},

		hideInstruction: function() {
			this.$('.editor-sidebar-instruction').addClass('display-none');
		}

	}, {
		template:'editorSidebar'
	});

	return EditorSidebarView;

})