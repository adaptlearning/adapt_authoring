define(function(require){

  var AdaptBuilder = require('coreJS/app/adaptBuilder');
  var BuilderView = require('coreJS/app/views/builderView');
  
  var EditorMenuView = BuilderView.extend({

    tagName: "div",

    className: "editor-menu",

    preRender: function() {
      this.listenTo(this.collection, 'sync', this.setupMenuViews);
      this.collection.fetch();
    },

    setupMenuViews: function() {

    }

  }, {
    template: 'editorMenu'
  });

  return EditorMenuView;

});
