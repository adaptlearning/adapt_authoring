define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('coreJS/editor/views/editorOriginView');
  var EditorBlockView = require('coreJS/editor/views/editorBlockView');
  var EditorModel = require('coreJS/editor/models/editorModel');
  var EditorBlockModel = require('coreJS/editor/models/editorBlockModel');
  var EditorPasteZoneView = require('coreJS/editor/views/EditorPasteZoneView');

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
      this.listenTo(Origin, 'editorView:removeSubViews', this.remove);
      this.listenTo(Origin, 'editorPageView:removePageSubViews', this.remove);
    },

    postRender: function() {
      this.addBlockViews();
    },

    addBlockViews: function() {
      this.$('.page-article-blocks').empty();

      // Pre-block paste zone
      var firstBlock = this.model.getChildren().at(0);
      if (firstBlock) {
        var dummyBlock = firstBlock.clone();
        dummyBlock.set('_pasteZoneSortOrder', 1);
        this.$('.page-article-blocks').append(new EditorPasteZoneView({model: dummyBlock}).$el);
      }

      this.model.getChildren().each(function(block) {
        this.$('.page-article-blocks').append(new EditorBlockView({model: block}).$el);

        var sortOrder = block.get('_sortOrder');
        sortOrder++;
        block.set('_pasteZoneSortOrder', sortOrder);

        // Post-block paste zone - sort order of placeholder will be one greater
        this.$('.page-article-blocks').append(new EditorPasteZoneView({model: block}).$el);

      }, this);
    },

    addBlock: function(event) {
      event.preventDefault();

      var thisView = this;
      var newPageBlockModel = new EditorBlockModel();

      newPageBlockModel.save({
        title: window.polyglot.t('app.placeholdernewblock'),
        body: window.polyglot.t('app.placeholdereditthistext'),
        _parentId: thisView.model.get('_id'),
        _courseId: Origin.editor.data.course.get('_id')
      },
      {
        error: function() {
          alert('error adding new block');
        },
        success: function() {
          Origin.trigger('editorView:fetchData');
        }
      });
    },

    deletePageArticle: function(event) {
      event.preventDefault();

      var thisView = this;

      if (confirm(window.polyglot.t('app.confirmdeletearticle'))) {
        console.log('deleting article', this.model);
        this.model.destroy({
          success: function(success) {
            thisView.remove();
            Origin.trigger('editorView:fetchData');
            // console.log('success', success);
          }, 
          error: function(error) {
            console.log('error', error);
          }
        });
      }
    },

    loadPageEdit: function (event) {
      event.preventDefault();
      Origin.trigger('editorSidebarView:addEditView', this.model);
    }

  }, {
    template: 'editorArticle'
  });

  return EditorArticleView;

});
