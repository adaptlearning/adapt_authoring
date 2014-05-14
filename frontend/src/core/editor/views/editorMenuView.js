define(function(require){

  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('coreJS/editor/views/editorOriginView');
  var EditorMenuItemView = require('coreJS/editor/views/editorMenuItemView');
  var EditorMenuLayerView = require('coreJS/editor/views/editorMenuLayerView');
  var EditorContentObjectModel = require('coreJS/editor/models/editorContentObjectModel');
  
  var EditorMenuView = EditorOriginView.extend({

    tagName: "div",

    className: "editor-menu",

    events: {
      'click .fake-add-page-button':'addPage'
    },

    preRender: function() {
      this.listenTo(Origin, 'editorView:removeSubViews', this.remove);
      this.listenTo(Origin, 'editorView:storeSelectedItem', this.storeSelectedItem);
      this.listenTo(Origin, 'editorMenuView:showMenuChildren', this.showMenuChildren);
    },

    postRender: function() {
      this.setupMenuViews();
    },

    storeSelectedItem: function(id) {
      console.log('storing menu current state', id);
      this.model.set('currentMenuState', id).save();
      this.setupMenuViews();
    },

    // renders menu layer view for each child of this contentObject renders menu item view
    setupMenuViews: function() {
      console.log('finsihed there');
      Origin.trigger('editorMenuView:removeMenuViews');
      //this.model.set('currentMenuState', '').save();
      // Find current selected item
      if (this.model.get('currentMenuState')) {
        //return console.log('there is a current menu state');
        var currentSelectedMenuItem = Origin.editor.data.contentObjects.findWhere({_id: this.model.get('currentMenuState')});
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

      /*// Find selected menu item
      var currentSelectedMenuItem = Origin.editor.data.contentObjects.findWhere({_id: Origin.editor.currentMenuState});

      // Recurse upwards until the hit the course setting each one as selected

      this.setupParentSelectedItems(currentSelectedMenuItem);
      // Render selected items children
      this.showMenuChildren(this.model);*/
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
