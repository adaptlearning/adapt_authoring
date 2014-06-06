define(function(require){

  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('coreJS/editor/views/editorOriginView');
  
  var EditorMenuItemView = EditorOriginView.extend({

    tagName: "div",

    className: "editor-menu-item",

    events: {
      'click .editor-menu-item-title'       : 'onMenuItemClicked',
      'click .editor-menu-item-icon'        : 'onMenuItemClicked',
      'click a.open-context-contentObject'  : 'openContextMenu'
    },

    preRender: function() {
      this.listenTo(Origin, 'editorMenuView:removeMenuViews', this.remove);
      this.listenTo(Origin, 'editorView:removeSubViews', this.remove);

      // Handle the context menu clicks
      this.on('contextMenu:menu:edit', this.editMenuItem);
      this.on('contextMenu:menu:copy', this.copyMenuItem);
      this.on('contextMenu:menu:delete', this.deleteMenuItem);

      this.on('contextMenu:page:edit', this.editMenuItem);
      this.on('contextMenu:page:copy', this.copyMenuItem);
      this.on('contextMenu:page:delete', this.deleteMenuItem);

      this.setupClasses();
    },

    copyMenuItem: function() {
      console.log('copyMenuItem clicked');
    },

    onMenuItemClicked: function() {
      // If a page has already been selected launch the editor
      if (this.model.get('_isSelected') && this.model.get('_type') == 'page') {
        return this.gotoPageEditor();
      }

      this.setItemAsSelected();
    },

    gotoPageEditor: function() {
      Origin.router.navigate('#/editor/' + Origin.editor.data.course.get('_id') + '/page/' + this.model.get('_id'), {trigger:true});
    },

    // expandedItemSelected: function() {
    //   console.log('expandedItemSelected');
    // },

    setItemAsSelected: function() {
      this.model.set({'_isSelected': true});
      this.model.set({'_isExpanded' : (this.model.get('_type') === 'menu' ? true : false)})

      this.showEditorSidebar();
      this.setParentSelectedState();
      this.setSiblingsSelectedState();
      this.setChildrenSelectedState();

      Origin.trigger('editorView:storeSelectedItem', this.model.get('_id'));
    },

    showEditorSidebar: function() {
      Origin.trigger('editorSidebarView:addEditView', this.model);
    },

    setupClasses: function() {
      var classString = '';
      if (this.model.get('_isSelected')) {
        classString += 'selected ';
      }
      if (this.model.get('_isExpanded')) {
        classString += 'expanded ';
      }
      classString += ('content-type-'+this.model.get('_type'));
      
      this.$el.addClass(classString);
    },

    setParentSelectedState: function() {
      this.model.getParent().set('_isSelected', false);
    },

    setSiblingsSelectedState: function() {
      this.model.getSiblings().each(function(sibling) {
        sibling.set({'_isSelected': false, '_isExpanded': false});
      });
    },

    setChildrenSelectedState: function() {
      this.model.getChildren().each(function(child) {
        child.set({'_isSelected': false, '_isExpanded': false});
      })
    },

    editMenuItem: function() {
      Origin.trigger('editorSidebarView:addEditView', this.model);
    },

    deleteMenuItem: function() {
      if (confirm(window.polyglot.t('app.confirmdelete' + this.model.get('_type')))) {
        if (this.model.destroy()) {
          this.remove();
        }
      }
    }
    
  }, {
    template: 'editorMenuItem'
  });

  return EditorMenuItemView;

});
