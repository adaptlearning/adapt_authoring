define(function(require){

  var AdaptBuilder = require('coreJS/app/adaptBuilder');
  var BuilderView = require('coreJS/app/views/builderView');
  var EditorMenuItemView = require('core/editor/views/editorMenuItemView');
  var EditorMenuLayerView = require('core/editor/views/editorMenuLayerView');
  
  var EditorMenuView = BuilderView.extend({

    tagName: "div",

    className: "editor-menu",

    preRender: function() {
      this.listenTo(this.collection, 'sync', this.setupMenuViews);
      this.collection.fetch();
    },

    setupMenuViews: function() {
      this.layers = [];
      this.setupCourseViews();
      this.collection.each(function(contentObject) {

        console.log(contentObject.get('_parentId'));
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
