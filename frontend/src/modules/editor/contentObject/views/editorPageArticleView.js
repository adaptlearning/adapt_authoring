// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var Origin = require('core/origin');

  var BlockModel = require('core/models/blockModel');
  var EditorOriginView = require('../../global/views/editorOriginView');
  var EditorPageBlockView = require('./editorPageBlockView');
  var EditorPasteZoneView = require('../../global/views/editorPasteZoneView');

  var EditorPageArticleView = EditorOriginView.extend({
    className: 'article editable article-draggable',
    tagName: 'div',

    events: _.extend({}, EditorOriginView.prototype.events, {
      'click a.add-block': 'addBlock',
      'click a.article-delete': 'deleteArticlePrompt',
      'click a.open-context-article': 'openContextMenu',
      'dblclick': 'loadArticleEdit'
    }),

    preRender: function() {
      this.listenToEvents();
    },

    postRender: function() {
      this.addBlockViews();
      this.setupDragDrop();
      _.defer(_.bind(function(){
        this.trigger('articleView:postRender');
        Origin.trigger('pageView:itemRendered');
      }, this));
    },

    listenToEvents: function() {
      this.listenTo(Origin, 'editorView:removeSubViews editorPageView:removePageSubViews', this.remove);

      if (!this.model.isNew()) {
        var id = this.model.get('_id');
        var events = {};
        events['editorView:moveBlock:' + id] = this.render;
        events['editorView:cutBlock:' + id] = this.onCutBlock;
        events['editorView:deleteArticle:' + id] = this.deletePageArticle;
        this.listenTo(Origin, events);
      }

      this.listenTo(this, {
        'contextMenu:article:edit': this.loadArticleEdit,
        'contextMenu:article:copy': this.onCopy,
        'contextMenu:article:copyID': this.onCopyID,
        'contextMenu:article:cut': this.onCut,
        'contextMenu:article:delete': this.deleteArticlePrompt
      });
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
      var view = new EditorPasteZoneView({
        model: new BlockModel({
          _parentId: this.model.get('_id'),
          _type: 'block',
          _pasteZoneSortOrder: 1
        })
      });
      this.$('.article-blocks').append(view.$el);
      // Iterate over each block and add it to the article
      this.model.getChildren().each(this.addBlockView, this);
    },

    addBlockView: function(blockModel, scrollIntoView) {
      var newBlockView = new EditorPageBlockView({model: blockModel});
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
      event && event.preventDefault();

      var self = this;
      var layoutOptions = [{
          type: 'left',
          name: 'app.layoutleft',
          pasteZoneRenderOrder: 2
        }, {
          type: 'full',
          name: 'app.layoutfull',
          pasteZoneRenderOrder: 1
        }, {
          type: 'right',
          name: 'app.layoutright',
          pasteZoneRenderOrder: 3
      }];

      var newPageBlockModel = new BlockModel({
        title: Origin.l10n.t('app.placeholdernewblock'),
        displayTitle: Origin.l10n.t('app.placeholdernewblock'),
        body: '',
        _parentId: self.model.get('_id'),
        _courseId: Origin.editor.data.course.get('_id'),
        layoutOptions: layoutOptions,
        _type: 'block'
      });

      newPageBlockModel.save(null, {
        error: function() {
          Origin.Notify.alert({ type: 'error', text: Origin.l10n.t('app.erroraddingblock') });
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
      event && event.preventDefault();

      Origin.Notify.confirm({
        type: 'warning',
        title: Origin.l10n.t('app.deletearticle'),
        text: Origin.l10n.t('app.confirmdeletearticle') + '<br />' + '<br />' + Origin.l10n.t('app.confirmdeletearticlewarning'),
        callback: _.bind(this.deleteArticleConfirm, this)
      });

    },

    deleteArticleConfirm: function(confirmed) {
      if (confirmed) {
        Origin.trigger('editorView:deleteArticle:' + this.model.get('_id'));
      }
    },

    deletePageArticle: function(event) {
      event && event.preventDefault();

      this.model.destroy({
        success: _.bind(this.remove, this),
        error: function(error) {
          Origin.Notify.alert({ type: 'error', text: Origin.l10n.t('app.errorgeneric') });
        }
      });
    },

    loadArticleEdit: function (event) {
      var courseId = Origin.editor.data.course.get('_id');
      var type = this.model.get('_type');
      var id = this.model.get('_id');
      Origin.router.navigateTo('editor/' + courseId + '/' + type + '/' + id + '/edit');
    },

    setupDragDrop: function() {
      var view = this;
      var autoScrollTimer = false;
      var $container = $('.contentPane');

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
        appendTo:'.app-inner',
        containment: '.app-inner',
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
        // adds a scroll if dragging near the top/bottom
        drag: function(event) {
          window.clearInterval(autoScrollTimer);

          var SCROLL_THRESHOLD = $container.height()*0.2;
          var SCROLL_INCREMENT = 7;

          var offsetTop = $container.offset().top;
          var clientY = event.originalEvent.clientY;
          var scrollAmount;

          if (clientY < (offsetTop+SCROLL_THRESHOLD)) {
            scrollAmount = -SCROLL_INCREMENT;
          }
          else if (clientY > (($container.height()+offsetTop) - SCROLL_THRESHOLD)) {
            scrollAmount = SCROLL_INCREMENT;
          }

          if(scrollAmount) {
            autoScrollTimer = window.setInterval(function() {
              $container.scrollTop($container.scrollTop()+scrollAmount);
            }, 10);
          }
        },
        stop: function () {
          window.clearInterval(autoScrollTimer);
          view.hideDropZones();
          $container.scrollTop($(this).offset().top*-1);
        }
      });
    }
  }, {
    template: 'editorPageArticle'
  });

  return EditorPageArticleView;
});
