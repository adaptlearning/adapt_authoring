define(function(require){

  var AdaptBuilder = require('coreJS/app/adaptBuilder');
  var BuilderView = require('coreJS/app/views/builderView');
  
  var EditorMenuItemView = BuilderView.extend({

    tagName: "div",

    className: "editor-menu-item",

    events: {
      'click .editor-menu-item-edit': 'editMenuItem'
    },

    editMenuItem: function() {
      AdaptBuilder.trigger('editorSidebar:addEditView', this.model);
    }

  }, {
    template: 'editorMenuItem'
  });

  return EditorMenuItemView;

});
