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
      this.listenTo(Origin, 'editor:removeSubViews', this.remove);
    },

    postRender: function() {
      this.setupMenuViews();
    },

    setupMenuViews: function() {
      this.setupCourseViews();

      var layerOne = this.renderMenuLayerView(this.model.get('_id'), false);
      this.model.getChildren().each(function(contentObject) {
        layerOne.append(new EditorMenuItemView({
          model: contentObject
        }).$el)
      }, this);
    },

    setupCourseViews: function() {
      this.renderMenuLayerView(null, true).append(new EditorMenuItemView({model:this.model}).$el);
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
