// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('coreJS/app/origin');
  var SidebarItemView = require('coreJS/sidebar/views/sidebarItemView');
  var AssetManagementRefineView = require('coreJS/assetManagement/views/assetManagementRefineView');

  var AssetManagementSidebarView = SidebarItemView.extend({
    events: {
      'click .asset-management-sidebar-new': 'onAddNewAssetClicked'
    },

    render: function() {
      SidebarItemView.prototype.render.apply(this, arguments);
      this.$el.append(new AssetManagementRefineView().$el);
    },

    onAddNewAssetClicked: function() {
      Origin.router.navigate('#/assetManagement/new', { trigger: true });
    }
  }, {
    template: 'assetManagementSidebar'
  });

  return AssetManagementSidebarView;
});
