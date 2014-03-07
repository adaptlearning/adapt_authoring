define(function(require) {

	var Origin = require('coreJS/app/origin');
	var OriginView = require('coreJS/app/views/originView');
	var EditorCourseEditView = require('coreJS/editor/views/editorCourseEditView');
	var EditorPageEditView = require('coreJS/editor/views/editorPageEditView');
	var EditorArticleEditView = require('coreJS/editor/views/editorArticleEditView');
	var EditorBlockEditView = require('coreJS/editor/views/editorBlockEditView');
	var EditorPageOverviewView = require('coreJS/editor/views/editorPageOverviewView');

	var EditorSidebarView = OriginView.extend({

		className: 'editor-sidebar',

		events: {
			'click a.editor-sidebar-tab' : 'tabToggle'
		},

		preRender: function() {
			this.listenTo(Origin, 'editorSidebar:addEditView', this.addEditingView);
            this.listenTo(Origin, 'editorSidebar:addOverviewView', this.addOverviewView);
		},

        addOverviewView: function() {
          var overview = new EditorPageOverviewView();
          this.$('.editor-sidebar-overview').append(overview.$el);
        },

// loads editing view in sidebar for differet elements
		addEditingView: function(model) {
			var type = model.get('_type');
			Origin.trigger('editorSidebar:removeEditView');
			var $sidebarForm = this.$('.edit-form');
			this.hideLoadingStatus();
			this.hideInstruction();
			this.$('.editor-form').empty();
			switch (type) {
				case 'course':
					$sidebarForm.append(new EditorCourseEditView({model: model}).$el);
					break;
				case 'page':
					$sidebarForm.append(new EditorPageEditView({model: model}).$el);
					break;
                case 'menu':
                    $sidebarForm.append(new EditorPageEditView({model: model}).$el);
                    break;
				case 'article':
					$sidebarForm.append(new EditorArticleEditView({model: model}).$el);
					break;
				case 'block':
					$sidebarForm.append(new EditorBlockEditView({model: model}).$el);
					break;
			}

            this.setTab('editor-sidebar-form');
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
