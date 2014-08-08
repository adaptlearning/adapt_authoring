define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('editorGlobal/views/editorOriginView');
  var EditorBlockView = require('editorPage/views/editorBlockView');
  var EditorModel = require('editorGlobal/models/editorModel');
  var EditorBlockModel = require('editorPage/models/editorBlockModel');
  var EditorPasteZoneView = require('editorGlobal/views/editorPasteZoneView');

  var EditorArticleView = EditorOriginView.extend({

    tagName: 'div',

    className: 'article editable article-draggable',

    events: _.extend({
      'click a.add-block'            : 'addBlock',
      'click a.article-delete'  : 'deleteArticlePrompt',
      'click a.open-context-article' : 'openContextMenu',
      'dblclick':'loadArticleEdit'
    }, EditorOriginView.prototype.events),

    preRender: function() {
      this.listenTo(Origin, {
        'editorView:removeSubViews': this.remove,
        'editorPageView:removePageSubViews': this.remove
      });

      this.listenTo(Origin, 'editorView:moveBlock:' + this.model.get('_id'), this.render);
      this.listenTo(Origin, 'editorView:cutBlock:' + this.model.get('_id'), this.onCutBlock);
      this.listenTo(Origin, 'editorView:deleteArticle:' + this.model.get('_id'), this.deletePageArticle);

      this.listenTo(this, {
        'contextMenu:article:edit': this.loadArticleEdit,
        'contextMenu:article:copy': this.onCopy,
        'contextMenu:article:cut': this.onCut,
        'contextMenu:article:delete': this.deleteArticlePrompt
      });
    },

    postRender: function() {
      this.addBlockViews();
      this.setupDragDrop();
      _.defer(_.bind(function(){
        this.trigger('articleView:postRender');
        Origin.trigger('pageView:itemRendered');
      }, this));
    },

    onCutBlock: function(view) {
      this.once('articleView:postRender', function() {
        view.showPasteZones();
      });
      this.render();
    },

    addBlockViews: function() {
      this.$('.article-blocks').empty();

      // Insert the 'pre' paste zone for blocks
      var prePasteBlock = new EditorBlockModel();
      prePasteBlock.set('_parentId', this.model.get('_id'));
      prePasteBlock.set('_type', 'block');
      prePasteBlock.set('_pasteZoneSortOrder', 1);

      this.$('.article-blocks').append(new EditorPasteZoneView({model: prePasteBlock}).$el);

      // Iterate over each block and add it to the article
      this.model.getChildren().each(function(block) {
        this.addBlockView(block);
      }, this);
    },

    addBlockView: function(blockModel, scrollIntoView) {
      var newBlockView = new EditorBlockView({model: blockModel}),
        sortOrder = blockModel.get('_sortOrder');
      
      scrollIntoView = scrollIntoView || false;

      this.$('.article-blocks').append(newBlockView.$el);
      
      if (scrollIntoView) {
        $.scrollTo(newBlockView.$el, 200);
      }

      // Increment the sortOrder property    
      blockModel.set('_pasteZoneSortOrder', sortOrder++);

      // Post-block paste zone - sort order of placeholder will be one greater
      this.$('.article-blocks').append(new EditorPasteZoneView({model: blockModel}).$el);
    },

    addBlock: function(event) {
      event.preventDefault();

      var _this = this;
      var newPageBlockModel = new EditorBlockModel();

      newPageBlockModel.save({
        title: 'Block title',
        displayTitle: '',
        body: '',
        _parentId: _this.model.get('_id'),
        _courseId: Origin.editor.data.course.get('_id')
      },
      {
        error: function() {
          alert('error adding new block');
        },
        success: function(model, response, options) {
          _this.addBlockView(model, true);

          Origin.editor.data.blocks.add(model);

          // Commenting out the next line
          // Origin.trigger('editorView:fetchData');
        }
      });
    },


    deleteArticlePrompt: function(event) {
      if (event) {
        event.preventDefault();
      }
      var id = this.model.get('_id');

      if (this.model.getChildren().length > 0) {
        var deleteArticle = {
          _type: 'prompt',
          _showIcon: true,
          title: window.polyglot.t('app.deletearticle'),
          body: window.polyglot.t('app.confirmdeletearticle') + '<br />' + '<br />' + window.polyglot.t('app.confirmdeletearticlewarning'),
          _prompts: [
            {_callbackEvent: 'editorView:deleteArticle:' + id, promptText: window.polyglot.t('app.ok')},
            {_callbackEvent: '', promptText: window.polyglot.t('app.cancel')}
          ]
        };

        Origin.trigger('notify:prompt', deleteArticle);
      }
      else {
        Origin.trigger('editorView:deleteArticle:' + id);
      }
    },


    deletePageArticle: function(event) {
      if (event) {
        event.preventDefault();
      }

      var _this = this;

      _this.model.destroy({
        success: function(model, response) {
          _this.remove();
        },
        error: function(error) {
          alert('An error occured');
        }
      });
    },

    loadArticleEdit: function (event) {
      Origin.router.navigate('#/editor/' + this.model.get('_type') + '/' + this.model.get('_id') + '/edit', {trigger: true});
    },

    setupDragDrop: function() {
      var view = this;
      this.$el.draggable({
        opacity: 0.8,
        handle: '.handle',
        revert: 'invalid',
        zIndex: 10000,
        cursorAt: {
          top: 10,
          left: 10
        },
        helper: function (e) {
          return $('<div class="drag-helper">' + view.model.get('title') + '</div>');
        },
        start: function () {
          view.showDropZones();
          $(this).attr('data-' + view.model.get('_type') + '-id', view.model.get('_id'));
          $(this).attr('data-'+ view.model.get('_parent') + '-id', view.model.get('_parentId'));
        },
        stop: function () {
          view.hideDropZones();
        }
      });
    }

  }, {
    template: 'editorArticle'
  });

  return EditorArticleView;

});
