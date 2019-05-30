// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var SidebarItemView = require('modules/sidebar/views/sidebarItemView');

  var AssetManagementUploadAssetSidebarView = SidebarItemView.extend({
    events: {
      'click .asset-management-upload-sidebar-upload-button': 'onUploadAssetsClicked',
      'click .asset-management-upload-sidebar-cancel-button': 'onCancelUploadAssetsClicked'
    },

    onUploadAssetsClicked: function() {
      this.updateButton('.asset-management-upload-sidebar-upload-button', Origin.l10n.t('app.saving'));
      Origin.trigger('assetManagement:uploadAssets');
    },

    onCancelUploadAssetsClicked: function() {
      Origin.router.navigateTo('assetManagement');
    }
  }, {
    template: 'assetManagementUploadAssetSidebar'
  });

  return AssetManagementUploadAssetSidebarView;
});
