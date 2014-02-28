define(function(require) {

	var Origin = require('coreJS/app/origin');
	var OriginView = require('coreJS/app/views/originView');
	var EditorCourseEditView = require('coreJS/editor/views/editorCourseEditView');
	var EditorPageEditView = require('coreJS/editor/views/editorPageEditView');
	var EditorArticleEditView = require('coreJS/editor/views/editorArticleEditView');

	var EditorSidebarView = OriginView.extend({

		className: 'editor-sidebar',

		preRender: function() {
			this.listenTo(Origin, 'editorSidebar:addEditView', this.addEditingView);
			this.listenTo(Origin, 'editorSidebar:removeEditView', this.removeEditingView);
		},

		addEditingView: function(model) {
			var type = model.get('_type');
			var editor;

			console.log('getting');

			console.log('type', type);

			this.hideLoadingStatus();
			this.hideInstruction();

			switch (type) {
				case 'course':
					editor = new EditorCourseEditView({model: model});
					break;
				case 'page':
					editor = new EditorPageEditView({model: model});
					break;
				case 'article':
					editor = new EditorArticleEditView({model: model});
					break;
			}

			this.$('.editor-sidebar-inner').empty();
			this.$('.editor-sidebar-inner').append(editor.$el);
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