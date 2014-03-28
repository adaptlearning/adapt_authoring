define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('coreJS/editor/views/editorOriginView');
  var EditorModel = require('coreJS/editor/models/editorModel');
  var EditorArticleView = require('coreJS/editor/views/editorArticleView');
  var EditorArticleModel = require('coreJS/editor/models/editorArticleModel');

  var EditorPageView = EditorOriginView.extend({

    tagName: 'div',

    className: 'page',

    events: {
      'click a.add-article'  : 'addArticle',
      'click a.edit-page'    : 'loadPageEdit',
      'click a.delete-page'  : 'deletePage',
      'click .paste-article' : 'onPaste',
      'click .paste-cancel'  : 'pasteCancel'
    },

    preRender: function() {
      this.listenTo(Origin, 'editorView:removeSubViews', this.remove);
    },

    postRender: function() {
      this.addArticleViews();
    },

    addArticleViews: function() {
      this.$('.page-articles').empty();
      Origin.trigger('editorPageView:removePageSubViews');
      this.model.getChildren().each(function(article) {
        this.$('.page-articles').append(new EditorArticleView({model: article}).$el);
      }, this);
    },

    deletePage: function(event) {
      event.preventDefault();
      
      if (confirm('Are you sure you want to delete this page?')) {
        if (this.model.destroy()) {
          this.remove();
          Origin.trigger('editorView:refreshPageList');
        }
      }
    },

    addArticle: function(event) {
      event.preventDefault();
      
      var thisView = this;
      var newPageArticleModel = new EditorArticleModel();
      newPageArticleModel.save({
        title: '{Your new article}',
        body: '{Edit this text...}',
        _parentId: thisView.model.get('_id'),
        _courseId: Origin.editor.data.course.get('_id')
      },
      {
        error: function() {
          alert('error adding new article');
        },
        success: function() {
          Origin.trigger('editorView:fetchData');
        }
      });
    },

    loadPageEdit: function (event) {
      event.preventDefault();
      Origin.trigger('editorSidebarView:addEditView', this.model);
    }

  }, {
    template: 'editorPage'
  });

  return EditorPageView;

});
