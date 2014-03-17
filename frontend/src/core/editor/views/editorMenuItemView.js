define(function(require){

  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('coreJS/editor/views/editorOriginView');
  
  var EditorMenuItemView = EditorOriginView.extend({

    tagName: "div",

    className: "editor-menu-item",

    events: {
      'click':'onMenuItemClicked'
    },

    preRender: function() {
      this.listenTo(Origin, 'editorView:removeSubViews', this.remove);
      this.listenTo(this.model, 'change:_isSelected', this.toggleSelectedClass);
      this.toggleSelectedClass(this.model);
    },

    onMenuItemClicked: function() {

      if (this.model.get('_isSelected')) {
        return this.viewPageEditMode();
      }

      console.log(this.model);

      this.model.set('_isSelected', true);

      this.showEditorSidebar();

      Origin.trigger('editorView:storeSelectedItem', this.model.get('_id'));

      this.showItemChildren();

      this.setSiblingsSelectedState();

      this.setChildrenSelectedState();

    },

    showEditorSidebar: function() {
      Origin.trigger('editorSidebarView:addEditView', this.model);
    },

    toggleSelectedClass: function(model) {
      if (model.get('_isSelected')) {
        return this.$el.addClass('selected');
      }
      this.$el.removeClass('selected');
    },

    setSiblingsSelectedState: function() {
      this.model.getSiblings().each(function(sibling) {
        sibling.set('_isSelected', false);
      });
    },

    setChildrenSelectedState: function() {
      this.model.setOnChildren('_isSelected', false);
      this.$el.addClass('selected');
    },

    showItemChildren: function() {
      Origin.trigger('editorMenuView:showMenuChildren', this.model);
    },

    viewPageEditMode: function() {
      Origin.router.navigate('#/editor/' + Origin.editor.data.course.get('_id') + '/page/' + this.model.get('_id'), {trigger:true});
    }/*,

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
    }*/
    

  }, {
    template: 'editorMenuItem'
  });

  return EditorMenuItemView;

});
