define(function(require) {

    var Origin = require('coreJS/app/origin');
    var SidebarItemView = require('coreJS/sidebar/views/sidebarItemView');

    var AssetManagementSidebarView = SidebarItemView.extend({

        events: {
            'click .asset-management-sidebar-new': 'onAddNewAssetClicked',
            'click .asset-management-sidebar-filter-button': 'onFilterButtonClicked',
            'click .asset-management-sidebar-filter-clear-search': 'onClearSearchClicked',
            'keyup .asset-management-sidebar-filter-search': 'onSearchKeyup'
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
                Origin.trigger('assetManagement:sidebarFilter:remove', filterType);
            } else {
                $currentTarget.addClass('selected');
                Origin.trigger('assetManagement:sidebarFilter:add', filterType);
            }

        },

        onSearchKeyup: function(event) {
            var filterText = $(event.currentTarget).val();
            Origin.trigger('assetManagement:dashboardSidebarView:filter', filterText);
        },

        onClearSearchClicked: function(event) {
            event.preventDefault();
            this.$('.asset-management-sidebar-filter-search').val('').trigger('keyup');
        }

    }, {
        template: 'assetManagementSidebar'
    });

    return AssetManagementSidebarView;

});
