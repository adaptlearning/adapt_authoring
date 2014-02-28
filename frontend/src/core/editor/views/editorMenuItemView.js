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
      console.log('clicked edit button')
      AdaptBuilder.trigger('editorSidebar:addEditView');
    }

  }, {
    template: 'editorMenuItem'
  });

  return EditorMenuItemView;

});
