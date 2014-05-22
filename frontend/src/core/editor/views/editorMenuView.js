define(function(require){

  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('coreJS/editor/views/editorOriginView');
  var EditorMenuItemView = require('coreJS/editor/views/editorMenuItemView');
  var EditorMenuLayerView = require('coreJS/editor/views/editorMenuLayerView');
  var EditorContentObjectModel = require('coreJS/editor/models/editorContentObjectModel');
  
  var EditorMenuView = EditorOriginView.extend({

    tagName: "div",

    className: "editor-menu",

    events: {},

    preRender: function() {
      this.listenTo(Origin, 'editorView:removeSubViews', this.remove);
      this.listenTo(Origin, 'editorView:storeSelectedItem', this.storeSelectedItem);
      this.listenTo(Origin, 'editorMenuView:showMenuChildren', this.showMenuChildren);
    },

    postRender: function() {
      this.setupMenuViews();
    },

    storeSelectedItem: function(contentObjectId) {
      // Store the ID of the currently selected contentObject
      Origin.editor.currentContentObjectId = contentObjectId;

      // Reset the address bar to allow persistance of the 'Back' button
      Backbone.history.navigate('#editor/' + Origin.editor.data.course.id + '/menu/' + contentObjectId);

      this.setupMenuViews();

      this.setupDragDrop();
    },

    setupDragDrop: function() {
      $(".editor-menu-layer-inner").sortable({
        connectWith: ".editor-menu-layer-inner",
        beforeStop: function( event, ui ) {
          console.log('about to drop');
        }
      }).disableSelection();
    },

    // renders menu layer view for each child of this contentObject renders menu item view
    setupMenuViews: function() {
      Origin.trigger('editorMenuView:removeMenuViews');

      if (Origin.editor.currentContentObjectId) {
        var currentSelectedMenuItem = Origin.editor.data.contentObjects.findWhere({_id: Origin.editor.currentContentObjectId});

        if (!currentSelectedMenuItem) {
          this.showMenuChildren(this.model);

          return this.showExpandedMenuChildren(this.model);
        }

        if (currentSelectedMenuItem.get('_type') === 'menu') {
          currentSelectedMenuItem.set({'_isExpanded': true, '_isSelected': true});
        } else {
          currentSelectedMenuItem.set({'_isExpanded': false, '_isSelected': true});
        }

        this.setParentElementToSelected(currentSelectedMenuItem);

        return this.showExpandedMenuChildren(this.model);
      }

      this.showMenuChildren(this.model);
    },

    setParentElementToSelected: function(currentSelectedMenuItem) {
      if (currentSelectedMenuItem.get('_parentId') === this.model.get('_id')) {
        return this.showMenuChildren(this.model);
      }
      var parentModel = Origin.editor.data.contentObjects.findWhere({_id: currentSelectedMenuItem.get('_parentId')});
      parentModel.set('_isExpanded', true);
      this.setParentElementToSelected(parentModel);
    },

    showExpandedMenuChildren: function(model) {
      var currentExpandedItem = Origin.editor.data.contentObjects.findWhere({_parentId: model.get('_id'), _isExpanded:true});
      if (!currentExpandedItem) {
        return;
      }
      if (currentExpandedItem.get('_parentId') === this.model.set('currentMenuState')) {
        return console.log('got to currentMenuState');
      }
      this.showMenuChildren(currentExpandedItem);
      this.showExpandedMenuChildren(currentExpandedItem);
    },

    setupParentSelectedItems: function(currentSelectedMenuItem) {
      //console.log('currentSelectedMenuItem', currentSelectedMenuItem);
    },

    showMenuChildren: function(model) {
      var menuLayer = this.renderMenuLayerView(model.get('_id'), false);
      model.getChildren().each(function(contentObject) {
        menuLayer.append(new EditorMenuItemView({
          model: contentObject
        }).$el)
      }, this);
    },

    renderMenuLayerView: function(parentId, isCourseObject) {
      var menuLayerView = new EditorMenuLayerView({_parentId:parentId, _isCourseObject: isCourseObject})
      this.$('.editor-menu-inner').append(menuLayerView.$el);
      return menuLayerView.$('.editor-menu-layer-inner');
    }

  }, {
    template: 'editorMenu'
  });

  return EditorMenuView;

});
