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
      // Check if the current item is expanded and update the next menuLayerView
      // This can end up being recursive if an item is selected inside a few menu items
      if(this.model.get('_isExpanded')) {
        Origin.trigger('editorView:menuView:updateSelectedItem', this);
      }
    },

    remove: function() {
      this.$el.closest('.editor-menu-layer').off('mousemove');
      EditorOriginView.prototype.remove.apply(this, arguments);
    },

    setupEvents: function() {
      this.listenTo(Origin, 'editorView:removeSubViews', this.remove);

      this.listenTo(this.model, {
        'change:_isExpanded': this.onExpandedChange,
        'change:_isSelected': this.onSelectedChange
      });
      // Handle the context menu clicks
      this.on('contextMenu:' + this.model.get('_type') + ':edit', this.editMenuItem);
      this.on('contextMenu:' + this.model.get('_type') + ':copy', this.copyMenuItem);
      this.on('contextMenu:' + this.model.get('_type') + ':copyID', this.copyID);
      this.on('contextMenu:' + this.model.get('_type') + ':delete', this.deleteItemPrompt);

      this.$el.closest('.editor-menu').on('mousemove', _.bind(this.handleDrag, this));
    },

    setupClasses: function() {
      var classString = '';
      if (this.model.get('_isSelected')) classString += 'selected ';
      if(this.model.get('_isExpanded')) classString += 'expanded ';
      classString += ('content-type-'+this.model.get('_type'));
      this.$el.addClass(classString);
    },

    onMenuItemClicked: function(event) {
      event && event.preventDefault();
      // select item regardless of single/double click
      this.setItemAsSelected();
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
      var type = this.model.get('_type');
      if(type === 'page') {
        this.gotoPageEditor();
      }
      else if(type === 'menu') {
        this.gotoSubMenuEditor();
      }
    },

    gotoPageEditor: function() {
      Origin.router.navigateTo('editor/' + Origin.editor.data.course.get('_id') + '/page/' + this.model.get('_id'));
    },

    gotoSubMenuEditor: function() {
      Origin.router.navigateTo('editor/' + Origin.editor.data.course.get('_id') + '/menu/' + this.model.get('_id') + '/edit');
    },

    setItemAsSelected: function() {
      if(this.model.get('_isSelected')) {
        return;
      }
      if(this.model.get('_isExpanded')) {
        // bit odd, but we need to remove and child views before we continue
        this.model.set('_isExpanded', false);
      }
      else {
        this.setSiblingsSelectedState();
        this.setParentSelectedState();
      }
      this.model.set({
        _isExpanded: this.model.get('_type') === 'menu',
        _isSelected: true
      });
      // This event passes out the view to the editorMenuView to add
      // a editorMenuLayerView and setup this.subView
      Origin.trigger('editorView:menuView:updateSelectedItem', this);
    },

    setParentSelectedState: function() {
      this.model.getParent().set('_isSelected', false);
    },

    setSiblingsSelectedState: function() {
      this.model.getSiblings().each(function(sibling) {
        sibling.set({ _isSelected: false, _isExpanded: false });
      });
    },

    setChildrenSelectedState: function() {
      this.model.getChildren().each(function(child) {
        child.set({ _isSelected: false, _isExpanded: false });
      })
    },

    onSelectedChange: function(model, isSelected) {
      this.$el.toggleClass('selected', isSelected);
    },

    onExpandedChange: function(model, isExpanded) {
      var isMenuType = (this.model.get('_type') === 'menu');
      if(isExpanded) {
        this.$el.addClass('expanded');
        return;
      }
      if(isMenuType) {
        this.setChildrenSelectedState();
        if (this.subView) this.subView.remove();
      }
      this.$el.removeClass('expanded');
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
      this.model.set({ _isExpanded: false, _isSelected: false });
      // When deleting an item - the parent needs to be selected
      this.model.getParent().set({ _isSelected: true, _isExpanded: true });

      // We also need to navigate to the parent element - but if it's the courseId let's
      // navigate up to the menu
      var type = this.model.get('_type');
      var isTopLevel = (type === 'page' || type === 'menu');
      var parentId = isTopLevel ? '' : '/' + this.model.get('_parentId');
      Origin.router.navigateTo('editor/' + Origin.editor.data.course.id + '/menu' + parentId);

      if(this.model.destroy()) this.remove();
    },

    cancelDeleteItem: function() {
      this.stopListening(Origin, 'editorView:removeItem:'+ this.model.get('_id'), this.deleteItem);
      this.model.set({ _isSelected: true });
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
