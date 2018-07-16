// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var SidebarItemView = require('modules/sidebar/views/sidebarItemView');

  var PluginManagementUploadSidebarView = SidebarItemView.extend({
    events: {
      'click .pluginManagement-upload-sidebar-save-button': 'onSaveButtonClicked',
      'click .pluginManagement-upload-sidebar-cancel-button': 'onCancelButtonClicked'
    },

    onSaveButtonClicked: function() {
      this.updateButton('.pluginManagement-upload-sidebar-save-button', Origin.l10n.t('app.saving'));
      Origin.trigger('pluginManagement:uploadPlugin');
    },

    onCancelButtonClicked: function() {
      Origin.router.navigateTo('pluginManagement');
    }
  }, {
    template: 'pluginManagementUploadSidebar'
  });

  return PluginManagementUploadSidebarView;
});
