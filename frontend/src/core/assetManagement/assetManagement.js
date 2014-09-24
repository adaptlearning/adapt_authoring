define(function(require) {

  var Origin = require('coreJS/app/origin');
  var AssetModel = require('coreJS/assetManagement/models/assetModel');
  var AssetManagementView = require('coreJS/assetManagement/views/assetManagementView');
  var AssetManagementSidebarView = require('coreJS/assetManagement/views/assetManagementSidebarView');
  var AssetManagementNewAssetView = require('coreJS/assetManagement/views/assetManagementNewAssetView');
  var AssetManagementNewAssetSidebarView = require('coreJS/assetManagement/views/assetManagementNewAssetSidebarView');

  Origin.on('router:assetManagement', function(location, subLocation, action) {
    Origin.assetManagement = {};
    Origin.assetManagement.filterData = {};

    if (!location) {
        Origin.trigger('location:title:update', {title: 'Asset Management'});
        Origin.sidebar.addView(new AssetManagementSidebarView().$el);
        Origin.router.createView(AssetManagementView);
    } else if (location=== 'new') {
        Origin.trigger('location:title:update', {title: 'New Asset'});
        Origin.sidebar.addView(new AssetManagementNewAssetSidebarView().$el, {
            "backButtonText": "Back to assets",
            "backButtonRoute": "/#/assetManagement"
        });
        Origin.router.createView(AssetManagementNewAssetView, { model: new AssetModel });
    }
  });

  Origin.on('globalMenu:assetManagement:open', function() {
    Origin.router.navigate('#/assetManagement', {trigger: true});
  });

  var globalMenuObject = {
    "location": "global",
    "text": "Asset Management",
    "icon": "fa-file-image-o",
    "callbackEvent": "assetManagement:open",
    "sortOrder": 2
  };

  Origin.once('app:dataReady', function() {
    Origin.globalMenu.addItem(globalMenuObject);
  });

});
