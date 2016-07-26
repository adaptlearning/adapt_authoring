// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){

  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('editorGlobal/views/editorOriginView');

  var EditorMenuItemView = EditorOriginView.extend({

    tagName: "div",

    className: "editor-menu-item",

    events: {
        'click .editor-menu-item-inner'       : 'onMenuItemClicked',
        'click a.open-context-contentObject'  : 'openContextMenu',
        'click a.contentObject-delete'        : 'deleteItemPrompt'
    },

    preRender: function() {
      this.setupEvents();
      this.setupClasses();
    },

    postRender: function() {
      // Check if the current item is expanded and update the next menuLayerView
      // This can end up being recursive if an item is selected inside a few menu items
      if (this.model.get('_isExpanded')) {
        Origin.trigger('editorView:menuView:updateSelectedItem', this);
      }
    },

    setupEvents: function() {
      this.listenTo(Origin, 'editorView:removeSubViews', this.remove);
      this.listenTo(this.model, 'change:_isExpanded', this.onExpandedChange);
      this.listenTo(this.model, 'change:_isSelected', this.onSelectedChange);

      // Handle the context menu clicks
      this.on('contextMenu:menu:edit', this.editMenuItem);
      this.on('contextMenu:menu:copy', this.copyMenuItem);
      this.on('contextMenu:menu:copyID', this.copyID);
      this.on('contextMenu:menu:delete', this.deleteItemPrompt);

      this.on('contextMenu:page:edit', this.editMenuItem);
      this.on('contextMenu:page:copy', this.copyMenuItem);
      this.on('contextMenu:page:copyID', this.copyID);
      this.on('contextMenu:page:delete', this.deleteItemPrompt);
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

    onMenuItemClicked: function(event) {
      // TODO - Fix this to the view not the model
      // Boo - jQuery doesn't allow dblclick and single click on the same element
      // time for a timer timing clicks against time delay
      var delay = 300;
      var timer = null;
      // Needing to store this on the model as global variables
      // cause an issue that double click loses scope
      var clicks = this.model.get('clicks');
      this.model.set('clicks', clicks ? clicks : 0);

      var currentClicks = this.model.get('clicks') + 1;
      this.model.set('clicks', currentClicks);
      // No matter what type of click - select the item straight away
      this.setItemAsSelected();

      if(currentClicks === 1) {

        timer = setTimeout(_.bind(function() {

          this.model.set('clicks', 0);

        }, this), delay);

      } else if (currentClicks === 2) {

        clearTimeout(timer);
        // Only if the current double clicked it is a page item
        if (this.model.get('_type') == 'page') {
          this.gotoPageEditor();
        } else if (this.model.get('_type') == 'menu') {
          this.gotoSubMenuEditor();
        }
        this.model.set('clicks', 0);
      }

    },

    selectedLevel: function() {
      $(".editor-menu-layer").each(function() {
        if($(this).hasClass("selected")){
            $(this).removeClass("selected");
        }
      });

      if($(this.el).hasClass("content-type-menu")) {
        $(this.el).parent().parent().next().addClass("selected");
      }
      else {
        $(this.el).parent().parent().addClass("selected");
      }
      event && event.preventDefault();
    },

    onMenuItemDblClicked: function(event) {
      event && event.preventDefault();
    },

    gotoPageEditor: function() {
      Origin.router.navigate('#/editor/' + Origin.editor.data.course.get('_id') + '/page/' + this.model.get('_id'));
    },


   gotoSubMenuEditor: function() {
     Origin.router.navigate('#/editor/' + Origin.editor.data.course.get('_id') + '/menu/' + this.model.get('_id') + '/edit');
   },

    setItemAsSelected: function() {

      // If this item is already selected please do nothing
      // because sometimes nothing is quite compelling
      if (this.model.get('_isSelected')) return;
      // When item is clicked check whether this a menu item or not
      var isMenuType = (this.model.get('_type') === 'menu');

      // If this view is already expanded - reset to no be expanded
      // this will trigger the events to remove child views
      if (this.model.get('_isExpanded')) {
        this.model.set({'_isExpanded' : false});
      } else {
        this.setSiblingsSelectedState();
        this.setParentSelectedState();
      }

      this.model.set({'_isExpanded' : (isMenuType ? true : false)});

      this.model.set({'_isSelected': true});

      // This event passes out the view to the editorMenuView to add
      // a editorMenuLayerView and setup this.subView
      Origin.trigger('editorView:menuView:updateSelectedItem', this);

      this.selectedLevel();

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

    onSelectedChange: function(model, isSelected) {
      // This is used to toggle between _isSelected on the model
      if (!isSelected) {
        this.$el.removeClass('selected');
      } else {
        this.$el.addClass('selected');
      }
    },

    onExpandedChange: function(model, isExpanded) {
      var isMenuType = (this.model.get('_type') === 'menu');
      if (isExpanded) {
        //Origin.trigger('editorView:menuView:updateSelectedItem', this);
        this.$el.addClass('expanded');
      } else {
        // If not expanded unselect and unexpand child - this will work
        // recursively as _isExpanded will keep getting set
        if (isMenuType) {
          this.setChildrenSelectedState();
        }
        this.$el.removeClass('expanded');
      }

      // If this item is not meant to be expanded - remove subView
      if (!isExpanded && isMenuType && this.subView) {
        this.subView.remove();
      }

    },

    editMenuItem: function() {
      var courseId = Origin.editor.data.course.get('_id');
      var type = this.model.get('_type');
      var menuItemId = this.model.get('_id');

      Origin.router.navigate('#/editor/'
        + courseId
        + '/'
        + type
        + '/'
        + menuItemId
        + '/edit', {trigger: true});
    },

    deleteItemPrompt: function(event) {
      event && event.preventDefault();

      this.listenToOnce(Origin, 'editorView:removeItem:'+ this.model.get('_id'), this.deleteItem);
      this.listenToOnce(Origin, 'editorView:cancelRemoveItem:'+ this.model.get('_id'), this.cancelDeleteItem);

      var self = this;

      Origin.Notify.confirm({
        type: 'warning',
        title: window.polyglot.t('app.deleteitem'+ this.model.get('_type')),
        text: window.polyglot.t('app.confirmdelete' + this.model.get('_type')) + '<br />' + '<br />' + window.polyglot.t('app.confirmdeletewarning' + this.model.get('_type')),
        callback: function(isConfirmed) {
          self.onConfirmRemovePopup(isConfirmed);
        }
      });

    },

    onConfirmRemovePopup: function(isConfirmed) {
      var id = this.model.get('_id');
      if (isConfirmed) {
        Origin.trigger('editorView:removeItem:' + id);
      } else {
        Origin.trigger('editorView:cancelRemoveItem:' + id);
      }
    },

    copyMenuItem: function() {
      $('.paste-zone').addClass('show');
      $('.add-zone').css('visibility','hidden');
      Origin.trigger('editorView:copy', this.model);
    },

    copyID: function() {
      Origin.trigger('editorView:copyID', this.model);
    },

    deleteItem: function(event) {
      this.stopListening(Origin, 'editorView:cancelRemoveItem:'+ this.model.get('_id'), this.cancelDeleteItem);
      this.model.set({_isExpanded:false, _isSelected: false});
      // When deleting an item - the parent needs to be selected
      this.model.getParent().set({_isSelected:true, _isExpanded: true});

      // We also need to navigate to the parent element - but if it's the courseId let's
      // navigate up to the menu
      var parentId = (this.model.get('_parentId') === Origin.editor.data.course.id) ? '' : '/' + this.model.get('_parentId');
      Origin.router.navigate('#editor/' + Origin.editor.data.course.id + '/menu' + parentId);

      if (this.model.destroy()) {
        this.remove();
      }
    },

    cancelDeleteItem: function() {
      this.stopListening(Origin, 'editorView:removeItem:'+ this.model.get('_id'), this.deleteItem);
      this.model.set({_isSelected: true});
    }

  }, {
    template: 'editorMenuItem'
  });

  return EditorMenuItemView;

});
