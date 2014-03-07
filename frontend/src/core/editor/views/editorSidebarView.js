define(function(require) {

	var Origin = require('coreJS/app/origin');
	var EditorOriginView = require('coreJS/editor/views/editorOriginView');
	var EditorCourseEditView = require('coreJS/editor/views/editorCourseEditView');
	var EditorPageEditView = require('coreJS/editor/views/editorPageEditView');
	var EditorArticleEditView = require('coreJS/editor/views/editorArticleEditView');
	var EditorBlockEditView = require('coreJS/editor/views/editorBlockEditView');
	var EditorPageOverviewView = require('coreJS/editor/views/editorPageOverviewView');

	var EditorSidebarView = EditorOriginView.extend({

		className: 'editor-sidebar',

		events: {
			'click a.editor-sidebar-tab' : 'tabToggle'
		},

		preRender: function() {
			this.listenTo(Origin, 'editorSidebar:addEditView', this.addEditingView);
      this.listenTo(Origin, 'editorSidebar:addOverviewView', this.addOverviewView);
			this.listenTo(Origin, 'editorSidebar:removeEditView', this.removeEditingView);
		},

    addOverviewView: function() {
      var overview = new EditorPageOverviewView();
      this.$('.editor-sidebar-overview').append(overview.$el);
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

			this.$('.edit-form').empty();
			this.$('.edit-form').append(editor.$el);
      this.setTab('editor-sidebar-form');
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
		},

		tabToggle: function(event) {
			event.preventDefault();
			if (this.$(event.currentTarget).data('tab-content')) {
        this.$('.tab-content').addClass('display-none');
        this.$('.editor-sidebar-tab').removeClass('active');
				this.$('.'+$(event.currentTarget).data('tab-content')).removeClass('display-none');
        $(event.currentTarget).addClass('active');
			}
		},

    setTab: function(tabname) {
        if (this.$('a[data-tab-content="' + tabname + '"]')) {
        this.$('.tab-content').addClass('display-none');
        this.$('.editor-sidebar-tab').removeClass('active');
        this.$('.' + tabname).removeClass('display-none');
        this.$('a[data-tab-content="' + tabname + '"]').addClass('active');
      }
    }

	}, {
		template:'editorSidebar'
	});

	return EditorSidebarView;

});
