// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var SidebarItemView = require('modules/sidebar/views/sidebarItemView');

  var AssetManagementNewAssetSidebarView = SidebarItemView.extend({
    events: {
      'click .asset-management-new-sidebar-save-button': 'onSaveNewAssetClicked',
      'click .asset-management-new-sidebar-cancel-button': 'onCancelNewAssetClicked'
    },

    onSaveNewAssetClicked: function() {
      this.updateButton('.asset-management-new-sidebar-save-button', Origin.l10n.t('app.saving'));
      Origin.trigger('assetManagement:newAsset');
    },

    onCancelNewAssetClicked: function() {
      Origin.router.navigateTo('assetManagement');
    }
  }, {
    template: 'assetManagementNewAssetSidebar'
  });

  return AssetManagementNewAssetSidebarView;
});
