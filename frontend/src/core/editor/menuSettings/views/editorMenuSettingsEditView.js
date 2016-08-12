// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('editorGlobal/views/editorOriginView');
  var MenuSettingsCollection = require('editorMenuSettings/collections/editorMenuSettingsCollection');
  var MenuSettingsView = require('editorMenuSettings/views/editorMenuSettingsView');

  var EditorMenuSettingsEditView = EditorOriginView.extend({

    tagName: "ul",

    className: "editor-menu-settings-edit",

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
        if (menu.get('name') === this.model.get('_menu')) {
          isSelected = true;
        }

        menu.set('_isSelected', isSelected);
        this.$('.menu-settings-list').append(new MenuSettingsView({model: menu}).$el);

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
        return this.onSaveError(null, window.polyglot.t('app.errornomenuselected'));
      }

      var selectedMenuId = selectedMenu.get('_id');

      // Should push to api

      $.post('/api/menu/' + selectedMenuId + '/makeitso/' + this.model.get('_courseId'))
        .error(this.onSaveError)
        .done(this.onSaveSuccess);
    }

  },
  {
    template: "editorMenuSettingsEdit"
  });

  return EditorMenuSettingsEditView;

});
