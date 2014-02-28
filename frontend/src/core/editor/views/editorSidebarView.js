define(function(require) {

	var AdaptBuilder = require('coreJS/app/adaptbuilder');
	var BuilderView = require('coreJS/app/views/builderView');

	var EditorSidebarView = BuilderView.extend({

		className: 'editor-sidebar',

		preRender: function() {
			this.listenTo(AdaptBuilder, 'editorSidebar:addEditView', this.addEditingView);
			this.listenTo(AdaptBuilder, 'editorSidebar:removeEditView', this.removeEditingView);
		},

		addEditingView: function(view) {
			console.log('adding new sidebar view');
			this.hideLoadingStatus();
			this.hideInstruction();
			this.$('.editor-sidebar-inner').append(view);
			console.log('adding editing view');
		},

		removeEditingView: function() {
			this.showLoadingStatus();
			this.showInstruction();
		},

		hideLoadingStatus: function() {
			this.$('.editor-sidebar-loading').addClass('display-none');
		},

		hideInstruction: function() {
			this.$('.editor-sidebar-instruction').addClass('display-none');
		},

		showLoadingStatus: function() {
			this.$('.editor-sidebar-loading').removeClass('display-none');
		},

		showInstruction: function() {
			this.$('.editor-sidebar-instruction').removeClass('display-none');
		}

	}, {
		template:'editorSidebar'
	});

	return EditorSidebarView;

});