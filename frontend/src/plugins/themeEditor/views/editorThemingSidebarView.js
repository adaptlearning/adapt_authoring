// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var SidebarItemView = require('coreJS/sidebar/views/sidebarItemView');

  var EditorThemingSidebarView = SidebarItemView.extend({
    events: {
      'click .editor-theming-sidebar-save': 'saveEditing',
      'click .editor-theming-sidebar-savePreset': 'savePreset',
      'click .editor-theming-sidebar-cancel': 'cancelEditing'
    },

    initialize: function() {
      SidebarItemView.prototype.initialize.apply(this, arguments);
      this.listenTo(Origin, 'theming:showPresetButton', this.showPresetButton);
    },

    showPresetButton: function(show) {
      var btn = this.$('.editor-theming-sidebar-savePreset');
      if(show) btn.show();
      else btn.hide();
    },

    saveEditing: function(event) {
      event && event.preventDefault();
      this.updateButton('.editor-theming-sidebar-save', window.polyglot.t('app.saving'));
      Origin.trigger('editorThemingSidebar:views:save');
    },

    savePreset: function(event) {
      event && event.preventDefault();
      Origin.trigger('editorThemingSidebar:views:savePreset');
    },

    cancelEditing: function(event) {
        event && event.preventDefault();
        Origin.trigger('editorThemingSidebar:views:cancel');
        Backbone.history.history.back();
        Origin.trigger('editingOverlay:views:hide');
    }
  }, {
    template: 'editorThemingSidebar'
  });

  return EditorThemingSidebarView;
});
