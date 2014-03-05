define(function(require){

  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');
  var EditorMenuItemView = require('core/editor/views/editorMenuItemView');
  var EditorMenuLayerView = require('core/editor/views/editorMenuLayerView');
  
  var EditorMenuView = OriginView.extend({

    tagName: "div",

    className: "editor-menu",

    postRender: function() {
      this.setupMenuViews();
    },

    setupMenuViews: function() {
      this.setupCourseViews();
      Origin.editor.contentObjects.each(function(contentObject) {
        //console.log(contentObject.get('_parentId'));
      });
    },

    setupCourseViews: function() {
      this.renderMenuLayerView().append(new EditorMenuItemView({model:this.model}).$el);
    },

    renderMenuLayerView: function() {
      var menuLayerView = new EditorMenuLayerView()
      this.$('.editor-menu-inner').append(menuLayerView.$el);
      return menuLayerView.$('.editor-menu-layer-inner');
    }

  }, {
    template: 'editorMenu'
  });

  return EditorMenuView;

});
