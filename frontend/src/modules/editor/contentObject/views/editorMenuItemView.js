// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Origin = require('core/origin');
  var EditorOriginView = require('../../global/views/editorOriginView');

  var EditorMenuItemView = EditorOriginView.extend({
    className: "editor-menu-item",
    tagName: "div",

    autoScrollTimer: false,
    clickTimer: undefined,
    clickTimerActive: false,

    events: {
      'click .editor-menu-item-inner': 'onMenuItemClicked',
      'click a.open-context-contentObject': 'openContextMenu',
      'click a.contentObject-delete': 'deleteItemPrompt',
      'mousedown .handle': 'enableDrag'
    },

    preRender: function() {
      this.setupClasses();
    },

    postRender: function() {
      this.setupEvents();
    },

    remove: function() {
      this.$el.closest('.editor-menu-layer').off('mousemove');
      EditorOriginView.prototype.remove.apply(this, arguments);
    },

    setupEvents: function() {
      this.listenTo(Origin, 'editorView:removeSubViews', this.remove);

      var type = this.model.get('_type');

      this.on('contextMenu:' + type + ':edit', this.editMenuItem);
      this.on('contextMenu:' + type + ':copy', this.copyMenuItem);
      this.on('contextMenu:' + type + ':copyID', this.copyID);
      this.on('contextMenu:' + type + ':delete', this.deleteItemPrompt);

      this.$el.closest('.editor-menu').on('mousemove', _.bind(this.handleDrag, this));
    },

    setupClasses: function() {
      this.$el.addClass('content-type-' + this.model.get('_type'));
    },

    onMenuItemClicked: function(event) {
      event && event.preventDefault();
      this.trigger('click', this);
      // handle double-click
      if(this.clickTimerActive) {
        return this.onMenuItemDoubleClicked(event);
      }
      this.clickTimerActive = true;
      // jQuery doesn't allow dblclick and click on the same element, so have to do it ourselves
      this.clickTimer = window.setTimeout(_.bind(function() {
        this.clickTimerActive = false;
        window.clearTimeout(this.clickTimer);
      }, this), 300);
    },

    onMenuItemDoubleClicked: function(event) {
      event && event.preventDefault();
      this.trigger('dblclick', this);
    },

    editMenuItem: function() {
      var courseId = Origin.editor.data.course.get('_id');
      var type = this.model.get('_type');
      var menuItemId = this.model.get('_id');
      Origin.router.navigateTo('editor/' + courseId + '/' + type + '/' + menuItemId + '/edit');
    },

    deleteItemPrompt: function(event) {
      event && event.preventDefault();

      this.listenToOnce(Origin, 'editorView:removeItem:'+ this.model.get('_id'), this.deleteItem);
      this.listenToOnce(Origin, 'editorView:cancelRemoveItem:'+ this.model.get('_id'), this.cancelDeleteItem);

      var self = this;

      Origin.Notify.confirm({
        type: 'warning',
        title: Origin.l10n.t('app.deleteitem'+ this.model.get('_type')),
        text: Origin.l10n.t('app.confirmdelete' + this.model.get('_type')) + '<br />' + '<br />' + Origin.l10n.t('app.confirmdeletewarning' + this.model.get('_type')),
        callback: function(isConfirmed) {
          self.onConfirmRemovePopup(isConfirmed);
        }
      });
    },

    onConfirmRemovePopup: function(isConfirmed) {
      var id = this.model.get('_id');
      if (isConfirmed) {
        Origin.trigger('editorView:removeItem:' + id);
      } else {
        Origin.trigger('editorView:cancelRemoveItem:' + id);
      }
    },

    copyMenuItem: function() {
      Origin.trigger('editorView:copy', this.model);
    },

    copyID: function() {
      Origin.trigger('editorView:copyID', this.model);
    },

    deleteItem: function(event) {
      this.stopListening(Origin, 'editorView:cancelRemoveItem:'+ this.model.get('_id'), this.cancelDeleteItem);
      // We also need to navigate to the parent element - but if it's the courseId let's
      // navigate up to the menu
      var type = this.model.get('_type');
      var isTopLevel = (type === 'page' || type === 'menu');
      var parentId = isTopLevel ? '' : '/' + this.model.get('_parentId');
      Origin.router.navigateTo('editor/' + Origin.editor.data.course.id + '/menu' + parentId);

      this.model.destroy({
        success: _.bind(function(model) {
          Origin.trigger('editorView:itemDeleted', model);
          this.remove()
        }, this),
        error: function() {
          Origin.Notify.alert({
            type: 'error',
            text: 'app.errordelete'
          });
        }
      });
    },

    cancelDeleteItem: function() {
      this.stopListening(Origin, 'editorView:removeItem:'+ this.model.get('_id'), this.deleteItem);
    },

    enableDrag: function(event) {
      this.model.set('_isDragging', true);
    },

    handleDrag: function(event) {
      window.clearInterval(this.autoScrollTimer);
      this.autoScrollTimer = false;

      if(!this.model.get('_isDragging')) {
        return;
      }

      var $currentLayer = $(".editor-menu-layer[data-over='true'] > .editor-menu-layer-inner");

      if(!$currentLayer.length) {
        return;
      }

      this.autoScrollTimer = window.setInterval(function() {
        var SCROLL_THRESHOLD = $currentLayer.height()*0.2;
        var SCROLL_INCREMENT = 4;

        var offsetTop = $currentLayer.offset().top;
        var clientY = event.clientY;
        var scrollAmount;

        if (clientY < (offsetTop+SCROLL_THRESHOLD)) {
          scrollAmount = -SCROLL_INCREMENT;
        }
        else if (clientY > (($currentLayer.height()+offsetTop) - SCROLL_THRESHOLD)) {
          scrollAmount = SCROLL_INCREMENT;
        }

        if(scrollAmount) {
          $currentLayer.scrollTop($currentLayer.scrollTop()+scrollAmount);
        }
      }, 10);
    }
  }, {
    template: 'editorMenuItem'
  });

  return EditorMenuItemView;
});
