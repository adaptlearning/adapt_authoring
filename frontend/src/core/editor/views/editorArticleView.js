define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('coreJS/editor/views/editorOriginView');
  var EditorBlockView = require('coreJS/editor/views/editorBlockView');
  var EditorModel = require('coreJS/editor/models/editorModel');
  var EditorBlockModel = require('coreJS/editor/models/editorBlockModel');

  var EditorArticleView = EditorOriginView.extend({

    tagName: 'div',

    className: 'page-article',

    events: {
      'click a.add-block'           : 'addBlock',
      'click a.page-article-edit'   : 'loadPageEdit',
      'click a.page-article-delete' : 'deletePageArticle',
      'click .copy-article'         : 'onCopy',
      'click .paste-block'          : 'onPaste',
      'click .paste-cancel'         : 'pasteCancel'
    },

    preRender: function() {
      this.listenTo(Origin, 'editor:removeSubViews', this.remove);
      this.listenTo(Origin, 'editor:removePageSubViews', this.remove);
    },

    postRender: function() {
      this.addBlockViews();
    },

    addBlockViews: function() {
      this.$('.page-article-blocks').empty();

      this.model.getChildren().each(function(block) {
        this.$('.page-article-blocks').append(new EditorBlockView({model: block}).$el);
      }, this);
    },

    addBlock: function(event) {
      event.preventDefault();

      var thisView = this;
      var newPageBlockModel = new EditorBlockModel();

      newPageBlockModel.save({
        title: '{Your new Block}',
        body: '{Edit this text...}',
        _parentId: thisView.model.get('_id'),
        _courseId: Origin.editor.course.get('_id')
      },
      {
        error: function() {
          alert('error adding new block');
        },
        success: function() {
          Origin.trigger('editor:fetchData');
        }
      });
    },

    deletePageArticle: function(event) {
      event.preventDefault();

      if (confirm('Are you sure you want to delete this article?')) {
        console.log('deleting article', this.model);
        this.model.destroy({
          success: function(success) {
            console.log('success', success);
          }, 
          error: function(error) {
            console.log('error', error);
          }
        })
        if (this.model.destroy()) {
          console.log('deleting article or should have');
          this.remove();
        }
      }
    },

    loadPageEdit: function (event) {
      event.preventDefault();
      Origin.trigger('editorSidebar:addEditView', this.model);
    }

  }, {
    template: 'editorArticle'
  });

  return EditorArticleView;

});
