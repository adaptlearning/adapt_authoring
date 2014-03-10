define(function(require){

  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');
  
  var EditorMenuItemView = OriginView.extend({

    tagName: "div",

    className: "editor-menu-item",

    events: {
      'click .editor-menu-item-view-children':'showItemChildren',
      'click .editor-menu-item-view':'viewPageItem',
      'click .editor-menu-item-edit': 'editMenuItem',
      'click .editor-menu-item-delete': 'deleteMenuItem'
    },

    preRender: function() {
      this.listenTo(Origin, 'editorView:removeSubViews', this.remove);
    },

    viewPageItem: function() {
      Origin.router.navigate('#/editor/' + Origin.editor.course.get('_id') + '/page/' + this.model.get('_id'), {trigger:true});
    },

    editMenuItem: function() {
      Origin.trigger('editorSidebarView:addEditView', this.model);
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
      Origin.trigger('editorView:fetchData');
    },

// adds the id to the currentState (currentMenuState) array
// triggers showMenuChildren in editorMenuView which renders child contentObject views
    showItemChildren: function() {
      this.currentState = [];

      this.currentState.push(this.model.get('_id'));
      this.createStateArray(this.model);

      Origin.editor.currentMenuState = this.currentState;
      Origin.trigger('editorMenuView:showMenuChildren', this.model);
    },

    createStateArray: function(model) {
      if (!model.getParent().get('_id') === 'course') {
        this.currentState.push(model.getParent().get('_id'));
        this.createStateArray(model.getParent()); 
      }
      return;
    }
    

  }, {
    template: 'editorMenuItem'
  });

  return EditorMenuItemView;

});
