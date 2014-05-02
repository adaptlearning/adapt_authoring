define(function(require) {

  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('coreJS/editor/views/editorOriginView');
  var EditorCourseEditView = require('coreJS/editor/views/editorCourseEditView');
  var EditorPageOverviewView = require('coreJS/editor/views/editorPageOverviewView');
  var EditorPageEditView = require('coreJS/editor/views/editorPageEditView');
  var EditorArticleEditView = require('coreJS/editor/views/editorArticleEditView');
  var EditorBlockEditView = require('coreJS/editor/views/editorBlockEditView');
  var EditorComponentEditView = require('coreJS/editor/views/EditorComponentEditView');
  var EditorConfigEditView = require('coreJS/editor/views/editorConfigEditView');

  var EditorSidebarView = EditorOriginView.extend({

    className: 'editor-sidebar',

    events: {
      'click a.editor-sidebar-tab' : 'tabToggle'
    },

    preRender: function() {
      this.listenTo(Origin, 'editorSidebarView:addEditView', this.addEditingView);
      this.listenTo(Origin, 'editorSidebarView:addOverviewView', this.addOverviewView);
      this.listenTo(Origin, 'editorSidebarView:removeEditView', this.removeEditingView);
    },

    addOverviewView: function() {
      Origin.trigger('editorSidebarView:removeEditView');
      var overview = new EditorPageOverviewView();
      this.$('.editor-sidebar-overview').append(overview.$el);
    },

    // loads  view in sidebar for edit and overview elements
    // selects edit view depending on '_type' value
    addEditingView: function(model) {
      var type = model.get('_type');
      var $sidebarForm = this.$('.editor-sidebar-form');
      Origin.trigger('editorSidebarView:removeEditView');

      this.hideLoadingStatus();
      this.hideInstruction();

      $sidebarForm.empty();

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
        case 'component':
          $sidebarForm.append(new EditorComponentEditView({model: model}).$el);
          break;
        case 'config':
          $sidebarForm.append(new EditorConfigEditView({model: model}).$el);
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
