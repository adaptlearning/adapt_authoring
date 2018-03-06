// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Origin = require('core/origin');
  var EditorOriginView = require('../../global/views/editorOriginView');
  var EditorMenuLayerView = require('./editorMenuLayerView');
  var EditorMenuItemView = require('./editorMenuItemView');

  var EditorMenuView = EditorOriginView.extend({
    className: "editor-menu",
    tagName: "div",

    preRender: function() {
      this.listenTo(Origin, {
        'editorView:menuView:updateSelectedItem': this.updateSelectedItem,
        'window:resize': this.setupHorizontalScroll
      });
    },

    postRender: function() {
      this.setupMenuViews();
      _.defer(this.setViewToReady);
    },

    setupMenuViews: function() {
      this.addMenuLayerView(this);
      if (!Origin.editor.currentContentObjectId) {
        return;
      }
      this.restoreCurrentMenuState();
    },

    /**
     * Recursive function which shows the expanded children for a given context model
     * @param {Model} A given contextObject model
     */
    addMenuLayerView: function(view) {
      var menuLayer = this.renderMenuLayerView(view);
      // Add children views of current model
      view.model.getChildren().each(function(contentObject) {
        menuLayer.append(new EditorMenuItemView({ model: contentObject }).$el);
      }, this);

      _.defer(_.bind(function() {
        this.setupDragDrop();
        var $window = $(window);
        this.setupHorizontalScroll($window.width(), $window.height());
        this.scrollToElement();
      }, this));
    },

    /**
     * Appemds a menu item layer for a given ID to the editor
     * @param {String} parentId Unique identifier of the parent
     */
    renderMenuLayerView: function(view) {
      // Get the current views _id to store as the _parentId
      var parentId = view.model.get('_id');
      // Create MenuLayerView
      var menuLayerView = new EditorMenuLayerView({ _parentId: parentId });
      // Set subview on layerView so this can be removed
      view.subView = menuLayerView;
      // Render and append the view
      $('.editor-menu-inner').append(menuLayerView.$el);
      // Return the container ready to render menuItemView's
      return menuLayerView.$('.editor-menu-layer-inner');
    },

    /**
     * Restores the current menu state by finding the current element
     * then setting it's parent recursively to _isExpanded
     */
    restoreCurrentMenuState: function() {
      // Find current menu item
      var currentSelectedMenuItem = Origin.editor.data.contentObjects.findWhere({
        _id: Origin.editor.currentContentObjectId
      });
      currentSelectedMenuItem.set({ _isSelected: true, _isExpanded: true });
      this.setParentElementToSelected(currentSelectedMenuItem);
    },

    /**
    * This is triggered when an item is clicked
    */
    updateSelectedItem: function(view) {
      // store the ID of the currently selected contentObject
      Origin.editor.currentContentObjectId = view.model.get('_id');

      if(view.model.get('_type') === 'menu') {
        this.addMenuLayerView(view);
        return;
      }
      this.scrollToElement();
    },

    /**
     * Recursive function which shows any children for a given contentObject and sets
     * the UI element to 'expanded'
     * @param {Model} selectedItem A given contextObject model
     */
    setParentElementToSelected: function(selectedItem) {
      var parentId = selectedItem.get('_parentId');

      if(parentId === Origin.editor.data.course.get('_id')) {
        return;
      }
      var parentModel = Origin.editor.data.contentObjects.findWhere({ _id: parentId });
      parentModel.set('_isExpanded', true);

      this.setParentElementToSelected(parentModel);
    },

    setupHorizontalScroll: function(windowWidth, windowHeight) {
      var $menuLayers = this.$('.editor-menu-layer');
      var $menuView = this.$el;
      var $menuControls = this.$('.editor-menu-layer-controls');
      var itemWidth = $menuLayers.first().outerWidth(true);

      $('.editor-menu-inner').width(itemWidth * $menuLayers.length);
    },

    scrollToElement: function() {
      if ($('.selected').length < 1) {
        return;
      }
      this.$('.editor-menu-layer-inner').scrollTo('.expanded, .selected', { duration: 300, offset: { top: -20, left: 0 }, axis: 'y' });
      this.$el.scrollTo($('.selected').closest('.editor-menu-layer'), { duration: 300, axis: 'x' });
    },

    /**
     * Configures the JQueryUI sortable() plugin to enable drag and drop
     */
    setupDragDrop: function() {
      $(".editor-menu-layer-inner").sortable({
        containment: '.editor-menu',
        appendTo: '.editor-menu',
        items: '.editor-menu-item',
        handle: '.handle',
        connectWith: ".editor-menu-layer-inner",
        scroll: true,
        helper: 'clone',
        stop: function(event,ui) {
          var $draggedElement = ui.item;
          var id = $('.editor-menu-item-inner', $draggedElement).attr('data-id');
          var sortOrder = $draggedElement.index() + 1;
          var parentId = $draggedElement.closest('.editor-menu-layer').attr('data-parentId');
          var currentModel = Origin.editor.data.contentObjects.findWhere({ _id: id });
          currentModel.save({ _sortOrder: sortOrder, _parentId: parentId }, { patch: true });
          currentModel.set('_isDragging', false);
        },
        over: function(event, ui) {
          $(event.target).closest('.editor-menu-layer').attr('data-over', true);
        },
        out: function(event, ui) {
          $(event.target).closest('.editor-menu-layer').attr('data-over', false);
        },
        receive: function(event, ui) {
          // Prevent moving a menu item between levels
          if (ui.item.hasClass('content-type-menu')) ui.sender.sortable("cancel");
        }
      });
    }
  }, {
    template: 'editorMenu'
  });

  return EditorMenuView;
});
