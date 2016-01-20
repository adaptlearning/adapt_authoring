// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
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

      this.listenTo(this.model, 'sync', this.setupModelEvents);
      if (!this.model.isNew()) {
        this.setupModelEvents();
      }

      this.listenTo(this, {
        'contextMenu:article:edit': this.loadArticleEdit,
        'contextMenu:article:copy': this.onCopy,
        'contextMenu:article:copyID': this.onCopyID,
        'contextMenu:article:cut': this.onCut,
        'contextMenu:article:delete': this.deleteArticlePrompt
      });
    },

    setupModelEvents: function() {
      this.listenTo(Origin, 'editorView:moveBlock:' + this.model.get('_id'), this.render);
      this.listenTo(Origin, 'editorView:cutBlock:' + this.model.get('_id'), this.onCutBlock);
      this.listenTo(Origin, 'editorView:deleteArticle:' + this.model.get('_id'), this.deletePageArticle);
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
      var newBlockView = new EditorBlockView({model: blockModel});
      var sortOrder = blockModel.get('_sortOrder');

      // Add syncing class
      if (blockModel.isNew()) {
        newBlockView.$el.addClass('syncing');
      }

      scrollIntoView = scrollIntoView || false;

      this.$('.article-blocks').append(newBlockView.$el);

      if (scrollIntoView) {
        $.scrollTo(newBlockView.$el, 200);
      }

      // Increment the sortOrder property
      blockModel.set('_pasteZoneSortOrder', ++sortOrder);

      // Post-block paste zone - sort order of placeholder will be one greater
      this.$('.article-blocks').append(new EditorPasteZoneView({model: blockModel}).$el);
      // Return the block view so syncing can be shown
      return newBlockView;
    },

    addBlock: function(event) {
      if (event) {
        event.preventDefault();
      } 
      
      var self = this;
      var layoutOptions = [
        {
          type: 'left',
          name: 'app.layoutleft',
          pasteZoneRenderOrder: 2
        },
        {
          type: 'full',
          name: 'app.layoutfull',
          pasteZoneRenderOrder: 1
        },
        {
          type: 'right',
          name: 'app.layoutright',
          pasteZoneRenderOrder: 3
        }
      ];

      var newPageBlockModel = new EditorBlockModel({
        title: window.polyglot.t('app.placeholdernewblock'),
        displayTitle: window.polyglot.t('app.placeholdernewblock'),
        body: '',
        _parentId: self.model.get('_id'),
        _courseId: Origin.editor.data.course.get('_id'),
        layoutOptions: layoutOptions,
        _type: 'block'
      });

      newPageBlockModel.save(null, {
        error: function() {
          Origin.Notify.alert({
            type: 'error',
            text: window.polyglot.t('app.erroraddingblock')
          });
        },
        success: function(model, response, options) {
          var newBlockView = self.addBlockView(model, true);
          Origin.editor.data.blocks.add(model);
          newBlockView.$el.removeClass('syncing').addClass('synced');
          newBlockView.reRender();
        }
      });
    },

    deleteArticlePrompt: function(event) {
      if (event) {
        event.preventDefault();
      }

      Origin.Notify.confirm({
        type: 'warning',
        title: window.polyglot.t('app.deletearticle'),
        text: window.polyglot.t('app.confirmdeletearticle') + '<br />' + '<br />' + window.polyglot.t('app.confirmdeletearticlewarning'),
        callback: _.bind(this.deleteArticleConfirm, this)
      });

    },

    deleteArticleConfirm: function(confirmed) {
      if (confirmed) {
        var id = this.model.get('_id');
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
          Origin.Notify.alert({
            type: 'error',
            text: window.polyglot.t('app.errorgeneric')
          });
        }
      });
    },

    loadArticleEdit: function (event) {
      var courseId = Origin.editor.data.course.get('_id');
      var type = this.model.get('_type');
      var Id = this.model.get('_id');
      Origin.router.navigate('#/editor/'
        + courseId
        + '/'
        + type
        + '/'
        + Id
        + '/edit', {trigger: true});
    },

    setupDragDrop: function() {
      var view = this;
      this.$el.draggable({
        scroll: true,
        opacity: 0.8,
        handle: '.handle',
        revert: 'invalid',
        zIndex: 10000,
        cursorAt: {
          top: 22,
          left: 0
        },
        appendTo:'.editor-view',
        containment: '.editor-view',
        helper: function (e) {
          // Store the offset to stop the page jumping during the start of drag
          // because of the drop zones changing the scroll position on the page
          view.offsetTopFromWindow = view.$el.offset().top - $(window).scrollTop();
          // This is in the helper method because the height needs to be
          // manipulated before the drag start method due to adding drop zones
          view.showDropZones();
          $(this).attr('data-' + view.model.get('_type') + '-id', view.model.get('_id'));
          $(this).attr('data-'+ view.model.get('_parent') + '-id', view.model.get('_parentId'));
          return $('<div class="drag-helper">' + view.model.get('title') + '</div>');
        },
        start: function(event) {
          // Using the initial offset we're able to position the window back in place
          $(window).scrollTop(view.$el.offset().top -view.offsetTopFromWindow);
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
