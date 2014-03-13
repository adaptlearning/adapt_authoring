define(function(require){

  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');
  var EditorMenuItemView = require('coreJS/editor/views/editorMenuItemView');
  var EditorMenuLayerView = require('coreJS/editor/views/editorMenuLayerView');
  var EditorContentObjectModel = require('coreJS/editor/models/editorContentObjectModel');
  
  var EditorMenuView = OriginView.extend({

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
      Origin.editor.currentMenuState = id;
    },

    // renders menu layer view for each child of this contentObject renders menu item view
    setupMenuViews: function() {
      //this.setupCourseViews();
      console.log('setting up menu views and this is the currentMenuState', Origin.editor.currentMenuState);

      // Find selected menu item
      var currentSelectedMenuItem = Origin.editor.data.contentObjects.findWhere({_id: Origin.editor.currentMenuState});

      console.log(currentSelectedMenuItem);
      // Recurse upwards until the hit the course setting each one as selected

      // Render selected items children
      var layerOne = this.renderMenuLayerView(this.model.get('_id'), false);
      this.model.getChildren().each(function(contentObject) {
        layerOne.append(new EditorMenuItemView({
          model: contentObject
        }).$el)
      }, this);

/*
      // If there is a collection for currentMenuState 
      // render the view for the items in the collection
      if (Origin.editor.currentMenuState) {
        this.showMenuChildren(this.model);
        _.each(Origin.editor.currentMenuState, function(parentId) {
          this.showMenuChildren(Origin.editor.contentObjects.findWhere({_parentId:parentId}));
        }, this);
        
      }*/
    },

    setupCourseViews: function() {
      this.renderMenuLayerView(null, true).append(new EditorMenuItemView({model:this.model}).$el);
    },

    showMenuChildren: function(model) {
      console.log('Show should this guys children', model);
    },

// renders the views for the children of the current contentObject menu
// loops through currentMenuState array 
//     loops through contentObjects where _parentId === parentId
//        renders new editorMenuView passing contentObject model
/*    showMenuChildren: function(model) {

      console.log('showMenuChildren', model, Origin.editor.currentMenuState);

      _.each(Origin.editor.currentMenuState, function(parentId) {
        var layer = this.renderMenuLayerView(model.get('_id'), false);
        _.each(Origin.editor.contentObjects.where({_parentId: parentId}), function(contentObject) {
          layer.append(new EditorMenuItemView({
            model: contentObject
          }).$el);
        });

      }, this);
    },*/

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
