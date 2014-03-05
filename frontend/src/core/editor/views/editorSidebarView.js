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
		},

		addEditingView: function(model) {
			var type = model.get('_type');
			Origin.trigger('editorSidebar:removeEditView');
			var $sidebarForm = this.$('.editor-sidebar-form');
			this.hideLoadingStatus();
			this.hideInstruction();
			this.$('.editor-sidebar-form').empty();
			switch (type) {
				case 'course':
					$sidebarForm.append(new EditorCourseEditView({model: model}).$el);
					break;
				case 'page':
					$sidebarForm.append(new EditorPageEditView({model: model}).$el);
					break;
				case 'article':
					$sidebarForm.append(new EditorArticleEditView({model: model}).$el);
					break;
				case 'block':
					$sidebarForm.append(new EditorBlockEditView({model: model}).$el);
					break;
			}
		},

		removeEditingView: function(model) {
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
