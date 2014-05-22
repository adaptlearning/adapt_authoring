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

      // this.setupDragDrop();
    },

    // setupDragDrop: function() {
    //   $( ".draggable" ).draggable({ handle: ".editor-item-sidebar", revert: true, snap: true });
    //       // $( "#droppable" ).droppable({
    //       //   hoverClass: "ui-state-hover",
    //       //   drop: function( event, ui ) {
    //       //     $( this )
    //       //       .addClass( "ui-state-highlight" )
    //       //       .find( "p" )
    //       //         .html( "Dropped!" );
    //       //   }
    //       // });
 
    //   // $( "#draggable2" ).draggable();
    //   // $( "#droppable2" ).droppable({
    //   //   accept: "#draggable2",
    //   //   activeClass: "ui-state-default",
    //   //   drop: function( event, ui ) {
    //   //     $( this )
    //   //       .addClass( "ui-state-highlight" )
    //   //       .find( "p" )
    //   //         .html( "Dropped!" );
    //   //   }
    //   // });
    // },

    copyMenuItem: function() {
      console.log('copyMenuItem clicked');
    },


    onMenuItemClicked: function() {

      // Check if this model is already selected
      // If selected viewPageEditmMode()

      if (this.model.get('_isSelected') && this.model.get('_type') == 'page') {
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

    setupClasses: function() {
      var classString = '';
      if (this.model.get('_isSelected')) {
        classString += 'selected ';
      }
      if (this.model.get('_isExpanded')) {
        classString += 'expanded ';
      }
      classString += ('content-type-'+this.model.get('_type'));
      
      classString += ' draggable';
      this.$el.addClass(classString);

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
