define(function(require) {

    var Origin = require('coreJS/app/origin');
    var SidebarItemView = require('coreJS/sidebar/views/sidebarItemView');

    var AssetManagementSidebarView = SidebarItemView.extend({

        events: {
            'click .asset-management-sidebar-new': 'onAddNewAssetClicked'
        },

        onAddNewAssetClicked: function() {
            Origin.router.navigate('#/assetManagement/new', {trigger: true});
        }

    }, {
        template: 'assetManagementSidebar'
    });

    return AssetManagementSidebarView;

});
