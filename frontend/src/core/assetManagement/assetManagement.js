define(function(require) {

  var Origin = require('coreJS/app/origin');
  var AssetManagementView = require('coreJS/assetManagement/views/assetCollectionView');

  Origin.on('router:assetManagement', function(location, subLocation, action) {
    if (!location) {
      Origin.router.createView(AssetManagementView);
    }
  });

  Origin.on('globalMenu:assetManagement:open', function() {
    Origin.router.navigate('#/assetManagement', {trigger: true});
  });

  var globalMenuObject = {
    "location": "global",
    "text": "Asset Management",
    "icon": "assets",
    "callbackEvent": "assetManagement:open"
  };

  Origin.once('app:dataReady', function() {
    Origin.globalMenu.addItem(globalMenuObject);
  });

});