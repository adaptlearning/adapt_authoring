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
      this.listenTo(Origin, 'editorMenuView:removeMenuViews', this.remove);
      this.listenTo(Origin, 'editorView:removeSubViews', this.remove);
      this.setupClasses();
    },

    onMenuItemClicked: function() {

      // Check if this model is already selected
      // If selected viewPageEditmMode()

      if (this.model.get('_isSelected')) {
        return this.viewPageEditMode();
      }
      // else check whether I am expanded if so hide children

      /*if (this.model.get('_isExpanded')) {
        return this.expandedItemSelected();
      }*/
      // else check against siblings being selected

      this.setItemAsSelected();

    },

    viewPageEditMode: function() {
      Origin.router.navigate('#/editor/' + Origin.editor.data.course.get('_id') + '/page/' + this.model.get('_id'), {trigger:true});
    },

    expandedItemSelected: function() {
      console.log('expandedItemSelected');
    },

    setItemAsSelected: function() {
      if (this.model.get('_type') === 'menu') {
        this.model.set({'_isSelected': true, '_isExpanded': true});
      } else {
        this.model.set({'_isSelected': true, '_isExpanded': false});
      }
      this.showEditorSidebar();
      this.setParentSelectedState();
      this.setSiblingsSelectedState();
      this.setChildrenSelectedState();
      Origin.trigger('editorView:storeSelectedItem', this.model.get('_id'));
    },

    showEditorSidebar: function() {
      Origin.trigger('editorSidebarView:addEditView', this.model);
    },

    setupClasses: function(model) {
      if (this.model.get('_isSelected')) {
        this.$el.addClass('selected');
      }
      if (this.model.get('_isExpanded')) {
        this.$el.addClass('expanded');
      }
    },

    setParentSelectedState: function() {
      this.model.getParent().set('_isSelected', false);
    },

    setSiblingsSelectedState: function() {
      this.model.getSiblings().each(function(sibling) {
        sibling.set({'_isSelected': false, '_isExpanded':false});
      });
    },

    setChildrenSelectedState: function() {
      this.model.getChildren().each(function(child) {
        child.set({'_isSelected': false, '_isExpanded':false});
      })
      //this.model.setOnChildren({'_isSelected': false, '_isExpanded':false});
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
    }
    

  }, {
    template: 'editorMenuItem'
  });

  return EditorMenuItemView;

});
