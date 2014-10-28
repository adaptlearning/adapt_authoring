define(function(require) {

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('editorGlobal/views/editorOriginView');
  var MenuSettingsCollection = require('editorMenuSettings/collections/editorMenuSettingsCollection');
  var MenuSettingsView = require('editorMenuSettings/views/editorMenuSettingsView');

  var EditorMenuSettingsEditView = EditorOriginView.extend({

    tagName: "ul",

    className: "editor-menusettings-edit",

    events: {

    },

    preRender: function() {
      this.collection = new MenuSettingsCollection();
      this.listenTo(this.collection, 'sync', this.addMenuItemView);
      this.collection.fetch();

      this.listenTo(Origin, 'editorSideBarView:removeEditView', this.remove);
      this.listenTo(Origin, 'editorMenuSettingsEditSidebar:views:save', this.saveData);
    },

    postRender: function() {
    },

    addMenuItemView: function() {
      this.renderMenuItemViews();
      _.defer(this.setViewToReady);
    },

    renderMenuItemViews: function() {

      this.collection.each(function(menu) {

        var isSelected = false;
        if (menu.get('_id') === this.model.get('_menu')) {
          isSelected = true;
        }

        menu.set('_isSelected', isSelected);
        this.$('.menusettings-list').append(new MenuSettingsView({model: menu}).$el);

      }, this);

    },

    cancel: function(event) {
      event.preventDefault();
      Origin.trigger('editorSidebarView:removeEditView', this.model);
    },

    saveData: function(event) {
      if (event) {
        event.preventDefault();  
      }

      var selectedMenu = this.collection.findWhere({_isSelected: true});

      if (selectedMenu === undefined) {
        alert('No menu selected');
        return;
      } 

      var selectedMenuId = selectedMenu.get('_id');
      
      // Should push to api

      $.post('/api/menu/' + selectedMenuId + '/makeitso/' + this.model.get('_courseId'))
        .error(function() {
          alert('An error occurred doing the save');
        })
        .done(_.bind(function() {

          Origin.trigger('editingOverlay:views:hide');
          
          Origin.trigger('editor:refreshData', function() {
            Backbone.history.history.back();
            this.remove();
          }, this);

        }, this));
    }

  },
  {
    template: "editorMenuSettingsEdit"
  });

  return EditorMenuSettingsEditView;

});