// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){

  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('editorGlobal/views/editorOriginView');
  var EditorContentObjectModel = require('editorMenu/models/editorContentObjectModel');
  var EditorMenuLayerView = require('editorMenu/views/editorMenuLayerView');
  var EditorMenuItemView = require('editorMenu/views/editorMenuItemView');
  
  var EditorMenuView = EditorOriginView.extend({

    tagName: "div",

    className: "editor-menu",

    preRender: function() {
      this.listenTo(Origin, 'editorView:menuView:updateSelectedItem', this.updateSelectedItem);
      this.listenTo(Origin, 'window:resize', this.setupHorizontalScroll);
    },

    postRender: function() {
      this.setupMenuViews();
      _.defer(this.setViewToReady);  
    },

    /**
     * Renders a menu layer for each child of the contentObject, and each item within
     */
    setupMenuViews: function() {

      // If there's no currentContentObjectId
      if (!Origin.editor.currentContentObjectId) {
        this.addMenuLayerView(this);
      } else {
        this.addMenuLayerView(this);
        this.preserveCurrentMenuState();
      }
      
    },

    /**
     * Recursive function which shows the expanded children for a given context model
     * @param {Model} A given contextObject model 
     */
    addMenuLayerView: function(view) {
      // Render menu layer view
      var menuLayer = this.renderMenuLayerView(view, false);

      // Add children views of current model
      view.model.getChildren().each(function(contentObject) {
        menuLayer.append(new EditorMenuItemView({
          model: contentObject
        }).$el)
      }, this);

      _.defer(_.bind(function() {
        this.setupDragDrop();
        var $window = $(window);
        this.setupHorizontalScroll($window.width(), $window.height());
        this.scrollToElement();
      }, this));
    },

    /**
     * Presever the current menu state by finding the current element 
     * then setting it's parent recursively to _isExpanded
     */

    preserveCurrentMenuState: function() {
      // Find current menu item
      var currentSelectedMenuItem = Origin.editor.data.contentObjects.findWhere({
        _id: Origin.editor.currentContentObjectId
      });
      currentSelectedMenuItem.set({'_isSelected': true, '_isExpanded': true});
      this.setParentElementToSelected(currentSelectedMenuItem);
    },

    /**
     * Appemds a menu item layer for a given ID to the editor
     * @param {String} parentId Unique identifier of the parent
     * @param {Boolean} isCourseObject Flag to indicate if this is at the root level 
     */
    renderMenuLayerView: function(view) {
      // Get the current views _id to store as the _parentId
      var parentId = view.model.get('_id');

      // Create MenuLayerView
      var menuLayerView = new EditorMenuLayerView({_parentId: parentId});

      // Set subview on layerView so this can be removed
      view.subView = menuLayerView;

      // Render and append the view
      $('.editor-menu-inner').append(menuLayerView.$el);
      
      // Return the container ready to render menuItemView's
      return menuLayerView.$('.editor-menu-layer-inner');
    },

    updateSelectedItem: function(view) {

      // This is triggered when an item is clicked
      // Store this id and fake navigate to bookmark current users position
      this.storeSelectedItem(view);

      // If this item is a menu item let's render a MenuItemLayerView
      if (view.model.get('_type') === 'menu') {
        this.addMenuLayerView(view);
      } else {
        this.scrollToElement();
      }
    },

    /**
     * Adds a specified contentObject ID to Origin.editor, synchronises the address bar,
     * and sets up the menu UI for editing
     * @param {Number} Unique _id for a given contentObject
     */
    storeSelectedItem: function(view) {
      var selectedItemId = view.model.get('_id');
      // Store the ID of the currently selected contentObject
      Origin.editor.currentContentObjectId = selectedItemId;

      // Reset the address bar to allow persistance of the 'Back' button
      Origin.router.navigate('#editor/' + Origin.editor.data.course.id + '/menu/' + selectedItemId);
    },

    /**
     * Recursive function which shows any children for a given contentObject and sets 
     * the UI element to 'expanded'
     * @param {Model} selectedItem A given contextObject model 
     */
    setParentElementToSelected: function(selectedItem) {

      if (selectedItem.get('_parentId') === Origin.editor.data.course.get('_id')) {
        return;
      }

      var parentModel = Origin.editor.data.contentObjects.findWhere({
        _id: selectedItem.get('_parentId')
      });
      
      parentModel.set('_isExpanded', true);
      
      this.setParentElementToSelected(parentModel);
    },

    setupHorizontalScroll: function(windowWidth, windowHeight) {
        var $menuLayers = this.$('.editor-menu-layer');
        var $menuView = this.$el;
        var $menuControls = this.$('.editor-menu-layer-controls');
        // Get item width
        var itemWidth = $menuLayers.first().outerWidth(true);
        // Set menu holder to width by items length
        $('.editor-menu-inner').width(itemWidth * $menuLayers.length);
    },

    scrollToElement: function() {
      if ($('.selected').length) {
        this.$('.editor-menu-layer-inner').scrollTo('.expanded, .selected', {duration:300, offset: {top:-20, left:0}, axis: 'y'});
        this.$el.scrollTo($('.selected').closest('.editor-menu-layer'), {duration:300, axis: 'x'});
      }
    },

    /**
     * Configures the JQuery UI sortable() plugin to enable drag and drop on the menu editor
     */
    setupDragDrop: function() {
      var view = this;
      $(".editor-menu-layer-inner").sortable({
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

          // Find the model
          var currentModel = Origin.editor.data.contentObjects.findWhere({_id: id});
          
          // Save just the new attributes and patch them
          currentModel.save({_sortOrder: sortOrder, _parentId: parentId}, {patch: true});
        },
        over: function(event, ui) {
        },
        receive: function(event, ui) {
          if (ui.item.hasClass('content-type-menu')) {
            // Prevent moving a menu item between levels
            ui.sender.sortable("cancel");
          }
        }
      });
    }

  }, {
    template: 'editorMenu'
  });

  return EditorMenuView;

});
