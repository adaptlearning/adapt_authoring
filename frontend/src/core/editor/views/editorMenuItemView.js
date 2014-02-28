define(function(require){

  var AdaptBuilder = require('coreJS/app/adaptBuilder');
  var BuilderView = require('coreJS/app/views/builderView');
  
  var EditorMenuItemView = BuilderView.extend({

    tagName: "div",

    className: "editor-menu-item"

  }, {
    template: 'editorMenuItem'
  });

  return EditorMenuItemView;

});
