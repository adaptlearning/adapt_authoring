// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

    var Origin = require('coreJS/app/origin');
    var SidebarItemView = require('coreJS/sidebar/views/sidebarItemView');

    var AssetManagementNewAssetSidebarView = SidebarItemView.extend({

        events: {
            'click .asset-management-new-sidebar-save-button': 'onSaveNewAssetClicked',
            'click .asset-management-new-sidebar-cancel-button': 'onCancelNewAssetClicked'
        },

        onSaveNewAssetClicked: function() {
            this.updateButton('.asset-management-new-sidebar-save-button', window.polyglot.t('app.saving'));
            Origin.trigger('assetManagement:newAsset');
        },

        onCancelNewAssetClicked: function() {
            Origin.router.navigate('#/assetManagement', {trigger: true});
        }

    }, {
        template: 'assetManagementNewAssetSidebar'
    });

    return AssetManagementNewAssetSidebarView;

});
