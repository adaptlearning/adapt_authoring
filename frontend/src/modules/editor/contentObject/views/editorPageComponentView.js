// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Origin = require('core/origin');
  var EditorOriginView = require('../../global/views/editorOriginView');

  var EditorPageComponentView = EditorOriginView.extend({
    className: 'component editable component-draggable',
    tagName: 'div',

    settings: _.extend({}, EditorOriginView.prototype.settings, {
      autoRender: false,
    }),

    events: _.extend({}, EditorOriginView.prototype.events, {
      'click .component-delete': 'deleteComponentPrompt',
      'click .component-move': 'evaluateMove',
      'click .open-context-component': 'openContextMenu',
      'dblclick': 'loadComponentEdit'
    }),

    preRender: function() {
      this.$el.addClass('component-' + this.model.get('_layout'));
      this.listenTo(Origin, 'editorView:removeSubViews editorPageView:removePageSubViews', this.remove);
      this.on({
        'contextMenu:component:edit': this.loadComponentEdit,
        'contextMenu:component:copy': this.onCopy,
        'contextMenu:component:copyID': this.onCopyID,
        'contextMenu:component:delete': this.deleteComponentPrompt
      });
      this.evaluateLayout(_.bind(function(layouts) {
        this.model.set('_movePositions', layouts);
        this.render();
      }, this));
    },

    postRender: function () {
      this.setupDragDrop();
      _.defer(_.bind(function(){
        this.trigger('componentView:postRender');
        Origin.trigger('pageView:itemRendered', this);
      }, this));
    },

    deleteComponentPrompt: function(event) {
      event && event.preventDefault();

      Origin.Notify.confirm({
        type: 'warning',
        title: Origin.l10n.t('app.deletecomponent'),
        text: Origin.l10n.t('app.confirmdeletecomponent') + '<br />' + '<br />' + Origin.l10n.t('app.confirmdeletecomponentwarning'),
        callback: _.bind(function(confirmed) {
          if(confirmed) this.deleteComponent();
        }, this)
      });
    },

    deleteComponent: function() {
      this.model.destroy({
        success: _.bind(function(model) {
          this.remove();
          Origin.trigger('editorView:removeComponent:' + model.get('_parentId'));
        }, this),
        error: function(response) {
          console.error(response);
        }
      })
    },

    loadComponentEdit: function(event) {
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
          // Passing the supported layout as a parameter allows the method to
          // determine which drop zones should be displayed
          var supportedLayout = view.getSupportedLayout();
          view.showDropZones(supportedLayout);
          $(this).attr('data-component-id', view.model.get('_id'));
          $(this).attr('data-block-id', view.model.get('_parentId'));
          return $('<div class="drag-helper">' + view.model.get('title') + '</div>');
        },
        start: function(event) {
          // Using the initial offset we're able to position the window back in place
          $(window).scrollTop(view.$el.offset().top -view.offsetTopFromWindow);
        },
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
    },

    getSupportedLayout: function() {
      var componentType = Origin.editor.data.componenttypes.findWhere({ component: this.model.get('_component') });
      var supportedLayout = componentType.get('properties')._supportedLayout;
      // allow all layouts by default
      if(!supportedLayout) return { full: true, half: true };

      return {
        full: _.indexOf(supportedLayout.enum, 'full-width') > -1,
        half: _.indexOf(supportedLayout.enum, 'half-width') > -1
      }
    },

    evaluateLayout: function(cb) {
      var supportedLayout = this.getSupportedLayout();
      var movePositions = {
        left: false,
        right: false,
        full: false
      };
      this.model.fetchSiblings(_.bind(function(siblings) {
        var showFull = supportedLayout.full && siblings.length < 1;
        switch(this.model.get('_layout')) {
          case 'left':
            movePositions.right = supportedLayout.half;
            movePositions.full = showFull;
            break;
          case 'right':
            movePositions.left = supportedLayout.half;
            movePositions.full = showFull;
            break;
          case 'full':
            movePositions.left = supportedLayout.half;
            movePositions.right = supportedLayout.half;
            break
        }
        cb(movePositions);
      }, this));
    },

    evaluateMove: function(event) {
      event && event.preventDefault();
      var $btn = $(event.currentTarget);
      this.model.fetchSiblings(_.bind(function(siblings) {
        var isLeft = $btn.hasClass('component-move-left');
        var isRight = $btn.hasClass('component-move-right');
        var isFull = $btn.hasClass('component-move-full');
        // move self to layout of clicked button
        this.moveComponent(this.model.get('_id'), (isLeft ? 'left' : isRight ? 'right' : 'full'));
        // move sibling to inverse of self
        var siblingId = siblings && siblings.length > 0 && siblings.models[0].get('_id');
        if (siblingId) this.moveComponent(siblingId, (isLeft ? 'right' : 'left'));
      }, this));
    },

    moveComponent: function (id, layout) {
      var parentId = this.model.get('_parentId');
      $.ajax({
        type: 'PUT',
        url:'/api/content/component/' + id,
        data: {
          _layout: layout,
          _parentId: parentId
        },
        success: function(jqXHR, textStatus, errorThrown) {
          Origin.trigger('editorView:moveComponent:' + parentId);
        },
        error: function(jqXHR, textStatus, errorThrown) {
          Origin.Notify.alert({
            type: 'error',
            text: jqXHR.responseJSON.message
          });
        }
      });
    }
  }, {
    template: 'editorPageComponent'
  });

  return EditorPageComponentView;
});
