define(function(require){

  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');
  
  var EditorMenuItemView = OriginView.extend({

    tagName: "div",

    className: "editor-menu-item",

    events: {
      'click .editor-menu-item-view':'viewPageItem',
      'click .editor-menu-item-edit': 'editMenuItem',
      'click .editor-menu-item-delete': 'deleteMenuItem',
      'click':'showItemChildren'
    },

    preRender: function() {
      this.listenTo(Origin, 'editor:removeSubViews', this.remove);
    },

    viewPageItem: function() {
      Origin.router.navigate('#/editor/' + Origin.editor.course.get('_id') + '/page/' + this.model.get('_id'), {trigger:true});
    },

    editMenuItem: function() {
      Origin.trigger('editorSidebar:addEditView', this.model);
    },

    deleteMenuItem: function() {
      console.log('deleting');
      event.preventDefault();
      if (confirm('Are you sure you want to delete this page?')) {
        if (this.model.destroy()) {
          this.remove();
        }
      }
      // 
      Origin.trigger('editor:fetchData');
    },

    showItemChildren: function() {
      console.log('show children');
    }
    

  }, {
    template: 'editorMenuItem'
  });

  return EditorMenuItemView;

});
