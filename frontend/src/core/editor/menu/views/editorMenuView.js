define(function(require){

  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('editorGlobal/views/editorOriginView');
  var EditorMenuItemView = require('editorMenu/views/editorMenuItemView');
  var EditorMenuLayerView = require('editorMenu/views/editorMenuLayerView');
  var EditorContentObjectModel = require('editorMenu/models/editorContentObjectModel');
  
  var EditorMenuView = EditorOriginView.extend({

    tagName: "div",

    className: "editor-menu",

    events: {},

    preRender: function() {
      this.listenTo(Origin, 'editorView:removeSubViews', this.remove);
      this.listenTo(Origin, 'editorView:storeSelectedItem', this.storeSelectedItem);
      this.listenTo(Origin, 'editorMenuView:showMenuChildren', this.showMenuChildren);
      this.listenTo(Origin, 'window:resize', this.setupHorizontalScroll);
    },

    postRender: function() {
      this.setupMenuViews();   
    },

    /**
     * Adds a specified contentObject ID to Origin.editor, synchronises the address bar,
     * and sets up the menu UI for editing
     * @param {Number} Unique _id for a given contentObject
     */
    storeSelectedItem: function(contentObjectId) {
      // Store the ID of the currently selected contentObject
      Origin.editor.currentContentObjectId = contentObjectId;

      // Reset the address bar to allow persistance of the 'Back' button
      Backbone.history.navigate('#editor/' + Origin.editor.data.course.id + '/menu/' + contentObjectId);

      this.setupMenuViews();
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
        helper:'clone',
        stop: function(event,ui) {
            var $draggedElement = ui.item;

            var id = $('.editor-menu-item-inner', $draggedElement).attr('data-id');
            var sortOrder = $draggedElement.index('.editor-menu-item');
            var parentId = $draggedElement.parent('.editor-menu-layer').attr('data-parentid');

            console.log(sortOrder);

            $.ajax({
                type: 'PUT',
                url:'/api/content/contentobject/' + id,
                data: {_sortOrder: sortOrder, _parentId: parentId},
                complete:function(xhr, status) {
                    if (xhr.status == '200' && status == 'success') {
                        // Synchronise the contentObjects collection
                        Origin.editor.data.contentObjects.fetch({reset: true});

                        // Trigger page refresh
                        Origin.trigger('editorView:refreshPageList');
                    }
                }
            });

        },
        over: function(event, ui) {
        },
        receive: function(event, ui) {
          if (ui.item.hasClass('content-type-menu')) {
            // Prevent moving a menu item between levels
            //ui.sender.sortable("cancel");
          }
        }
      });
    },

    /**
     * Renders a menu layer for each child of the contentObject, and each item within
     */
    setupMenuViews: function() {
      Origin.trigger('editorMenuView:removeMenuViews');

      if (Origin.editor.currentContentObjectId) {
        var selectedItem = Origin.editor.data.contentObjects.findWhere({_id: Origin.editor.currentContentObjectId});

        if (!selectedItem) {
          this.showMenuChildren(this.model);

          return this.showExpandedMenuChildren(this.model);
        }

        selectedItem.set({'_isSelected' : true});
        selectedItem.set({'_isExpanded' : selectedItem.get('_type') == 'menu' ? true : false});

        this.setParentElementToSelected(selectedItem);

        return this.showExpandedMenuChildren(this.model);
      }

      this.showMenuChildren(this.model);
    },

    /**
     * Recursive function which shows any children for a given contentObject and sets 
     * the UI element to 'expanded'
     * @param {Model} selectedItem A given contextObject model 
     */
    setParentElementToSelected: function(selectedItem) {
      if (selectedItem.get('_parentId') === this.model.get('_id')) {
        return this.showMenuChildren(this.model);
      }

      var parentModel = Origin.editor.data.contentObjects.findWhere({_id: selectedItem.get('_parentId')});
      
      parentModel.set('_isExpanded', true);
      
      this.setParentElementToSelected(parentModel);
    },

    /**
     * Recursive function which shows the expanded children for a given context model
     * @param {Model} A given contextObject model 
     */
    showExpandedMenuChildren: function(model) {
      var expandedItem = Origin.editor.data.contentObjects.findWhere({_parentId: model.get('_id'), _isExpanded: true});
      
      if (!expandedItem) {
        return;
      }

      this.showMenuChildren(expandedItem);
      this.showExpandedMenuChildren(expandedItem);
    },

    /**
     * Recursive function which shows the expanded children for a given context model
     * @param {Model} A given contextObject model 
     */
    showMenuChildren: function(model) {
      var menuLayer = this.renderMenuLayerView(model.get('_id'), false);

      model.getChildren().each(function(contentObject) {
        menuLayer.append(new EditorMenuItemView({
          model: contentObject
        }).$el)
      }, this);

      this.setupDragDrop();
      _.defer(_.bind(function() {
        var $window = $(window);
        this.setupHorizontalScroll($window.width(), $window.height());
        //this.scrollToSelectedElement();
      }, this));
    },

    /**
     * Appemds a menu item layer for a given ID to the editor
     * @param {String} parentId Unique identifier of the parent
     * @param {Boolean} isCourseObject Flag to indicate if this is at the root level 
     */
    renderMenuLayerView: function(parentId, isCourseObject) {
      var menuLayerView = new EditorMenuLayerView({_parentId: parentId, _isCourseObject: isCourseObject});

      this.$('.editor-menu-inner').append(menuLayerView.$el);
      
      return menuLayerView.$('.editor-menu-layer-inner');
    },

    setupHorizontalScroll: function(windowWidth, windowHeight) {
        var $menuLayers = this.$('.editor-menu-layer');
        var $menuView = this.$el;
        // Get item width
        var itemWidth = $menuLayers.first().outerWidth(true);
        // Set menu holder to width by items length
        $('.editor-menu-inner').width(itemWidth * $menuLayers.length);

        // Set editor menu container to height of available space
        // Get offset to work out space menu is set inside
        var menuOffsetTop = this.$el.offset().top;
        // Set height
        this.$el.height(windowHeight - menuOffsetTop);
        this.$('.editor-menu-layer').height(windowHeight - menuOffsetTop);

    }

  }, {
    template: 'editorMenu'
  });

  return EditorMenuView;

});
