define(function(require) {

	var Origin = require('coreJS/app/origin');
	var OriginView = require('coreJS/app/views/originView');
	var EditorCourseEditView = require('coreJS/editor/views/editorCourseEditView');
	var EditorPageEditView = require('coreJS/editor/views/editorPageEditView');
	var EditorArticleEditView = require('coreJS/editor/views/editorArticleEditView');
	var EditorBlockEditView = require('coreJS/editor/views/editorBlockEditView');

	var EditorSidebarView = OriginView.extend({

		className: 'editor-sidebar',

		preRender: function() {
			this.listenTo(Origin, 'editorSidebar:addEditView', this.addEditingView);
			this.listenTo(Origin, 'editorSidebar:removeEditView', this.removeEditingView);
		},

		addEditingView: function(model) {
			var type = model.get('_type');
			var editor;

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
				case 'block':
					editor = new EditorBlockEditView({model: model});
					break;
			}

			this.$('.editor-sidebar-form').empty();
			this.$('.editor-sidebar-form').append(editor.$el);
		},

		removeEditingView: function(model) {
			Origin.trigger('editor:removeSubViews');
			this.$('.editor-sidebar-form').empty();
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
