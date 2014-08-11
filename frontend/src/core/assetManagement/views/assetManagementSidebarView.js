define(function(require) {

    var Origin = require('coreJS/app/origin');
    var SidebarItemView = require('coreJS/sidebar/views/sidebarItemView');

    var AssetManagementSidebarView = SidebarItemView.extend({

        events: {
            'click .asset-management-sidebar-new': 'onAddNewAssetClicked',
            'click .asset-management-sidebar-filter-button': 'onFilterButtonClicked'
        },

        onAddNewAssetClicked: function() {
            Origin.router.navigate('#/assetManagement/new', {trigger: true});
        },

        onFilterButtonClicked: function(event) {
            $currentTarget = $(event.currentTarget);
            var filterType = $currentTarget.attr('data-filter-type');

            // If this filter is already selected - remove filter
            // else add the filter
            if ($currentTarget.hasClass('selected')) {
                $currentTarget.removeClass('selected');
                Origin.trigger('assetManagementSidebar:filter:remove', filterType);
            } else {
                $currentTarget.addClass('selected');
                Origin.trigger('assetManagementSidebar:filter:add', filterType);
            }

        }

    }, {
        template: 'assetManagementSidebar'
    });

    return AssetManagementSidebarView;

});
