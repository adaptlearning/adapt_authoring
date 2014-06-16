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

    className: 'page-article editable article-draggable',

    events: _.extend(EditorOriginView.prototype.events, {
      'click a.add-block'            : 'addBlock',
      'click a.page-article-delete'  : 'deletePageArticle',
      'click a.paste-article'        : 'onPaste',
      'click a.open-context-article' : 'openContextMenu'
    }),

    preRender: function() {
      this.listenTo(Origin, 'editorView:removeSubViews', this.remove);
      this.listenTo(Origin, 'editorPageView:removePageSubViews', this.remove);
      this.listenTo(Origin, 'editorView:moveBlock:' + this.model.get('_id'), this.render);
      this.listenTo(Origin, 'editorView:cutBlock:' + this.model.get('_id'), this.onCutBlock);

      this.on('contextMenu:article:edit', this.loadPageEdit);
      this.on('contextMenu:article:copy', this.onCopy);
      this.on('contextMenu:article:cut', this.onCut);
      this.on('contextMenu:article:delete', this.deletePageArticle);
    },

    postRender: function() {
      this.addBlockViews();
      this.setupDragDrop();
      _.defer(_.bind(function(){
        this.trigger('articleView:postRender');
      }, this));
    },

    onCutBlock: function(view) {
      this.once('articleView:postRender', function() {
        view.showPasteZones();
      });
      this.render();
    },

    addBlockViews: function() {
      this.$('.page-article-blocks').empty();

      // Insert the 'pre' paste zone for blocks
      var prePasteBlock = new EditorBlockModel();
      prePasteBlock.set('_parentId', this.model.get('_id'));
      prePasteBlock.set('_type', 'block');
      prePasteBlock.set('_pasteZoneSortOrder', 1);

      this.$('.page-article-blocks').append(new EditorPasteZoneView({model: prePasteBlock}).$el);

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

      var _this = this;
      var newPageBlockModel = new EditorBlockModel();

      newPageBlockModel.save({
        title: window.polyglot.t('app.placeholdernewblock'),
        body: window.polyglot.t('app.placeholdereditthistext'),
        _parentId: _this.model.get('_id'),
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
      if (event) {
        event.preventDefault();
      }

      var _this = this;

      if (confirm(window.polyglot.t('app.confirmdeletearticle'))) {
        this.model.destroy({
          success: function(success) {
            _this.remove();
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
