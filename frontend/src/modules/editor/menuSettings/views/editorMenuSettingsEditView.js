// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('core/origin');
  var EditorOriginView = require('../../global/views/editorOriginView');
  var MenuSettingsCollection = require('../collections/editorMenuSettingsCollection');
  var MenuSettingsView = require('./editorMenuSettingsView');

  var EditorMenuSettingsEditView = EditorOriginView.extend({
    className: "editor-menu-settings-edit",
    tagName: "ul",

    preRender: function() {
      this.collection = new MenuSettingsCollection();
      this.listenTo(this.collection, 'sync', this.addMenuItemView);
      this.collection.fetch();

      this.listenTo(Origin, {
        'editorSideBarView:removeEditView': this.remove,
        'editorMenuSettingsEditSidebar:views:save': this.saveData
      });
    },

    addMenuItemView: function() {
      this.renderMenuItemViews();
    },

    renderMenuItemViews: function() {
      this.collection.each(function(menu) {
        var isSelected = menu.get('name') === this.model.get('_menu');
        menu.set('_isSelected', isSelected);
        if(isSelected || menu.get('_isAvailableInEditor') === true) {
          this.$('.menu-settings-list').append(new MenuSettingsView({ model: menu }).$el);
        }
      }, this);
      this.setViewToReady();
    },

    cancel: function(event) {
      event && event.preventDefault();
      Origin.trigger('editorSidebarView:removeEditView', this.model);
    },

    saveData: function(event) {
      event && event.preventDefault();

      var selectedMenu = this.collection.findWhere({ _isSelected: true });

      if(selectedMenu === undefined) {
        return this.onSaveError(null, Origin.l10n.t('app.errornomenuselected'));
      }
      $.post('/api/menu/' + selectedMenu.get('_id') + '/makeitso/' + this.model.get('_courseId'))
        .error(_.bind(this.onSaveError, this))
        .done(_.bind(this.onSaveSuccess, this));
    }
  }, {
    template: "editorMenuSettingsEdit"
  });

  return EditorMenuSettingsEditView;
});
