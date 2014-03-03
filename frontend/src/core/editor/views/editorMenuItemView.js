define(function(require){

  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');
  
  var EditorMenuItemView = OriginView.extend({

    tagName: "div",

    className: "editor-menu-item",

    events: {
      'click .editor-menu-item-edit': 'editMenuItem'
    },

    editMenuItem: function() {
      Origin.trigger('editorSidebar:addEditView', this.model);
    }

  }, {
    template: 'editorMenuItem'
  });

  return EditorMenuItemView;

});
