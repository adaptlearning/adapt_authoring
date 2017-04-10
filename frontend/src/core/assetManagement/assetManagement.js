// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/app/origin');
  var AssetModel = require('core/assetManagement/models/assetModel');
  var AssetCollection = require('core/assetManagement/collections/assetCollection');
  var AssetManagementView = require('core/assetManagement/views/assetManagementView');
  var AssetManagementSidebarView = require('core/assetManagement/views/assetManagementSidebarView');
  var AssetManagementNewAssetView = require('core/assetManagement/views/assetManagementNewAssetView');
  var AssetManagementNewAssetSidebarView = require('core/assetManagement/views/assetManagementNewAssetSidebarView');
  var TagsCollection = require('core/tags/collections/tagsCollection');

  Origin.on('router:assetManagement', function(location, subLocation, action) {
    Origin.assetManagement = {};
    Origin.assetManagement.filterData = {};

    if (!location) {
        var tagsCollection = new TagsCollection();

        tagsCollection.fetch({
          success: function() {
            // Load asset collection before so sidebarView has access to it
            var assetCollection = new AssetCollection();
            // No need to fetch as the collectionView takes care of this
            // Mainly due to serverside filtering
            Origin.trigger('location:title:hide');
            Origin.sidebar.addView(new AssetManagementSidebarView({collection: tagsCollection}).$el);
            Origin.contentPane.setView(AssetManagementView, {collection: assetCollection});
            Origin.trigger('assetManagement:loaded');
          },
          error: function() {
            console.log('Error occured getting the tags collection - try refreshing your page');
          }
        });
    } else if (location=== 'new') {
        Origin.trigger('location:title:update', {title: 'New Asset'});
        Origin.sidebar.addView(new AssetManagementNewAssetSidebarView().$el);
        Origin.contentPane.setView(AssetManagementNewAssetView, { model: new AssetModel });
    } else if (subLocation === 'edit') {
      var Asset = new AssetModel({ _id: location });
      // Fetch existing asset model
      Asset.fetch({
        success: function() {
          Origin.trigger('location:title:update', {title: 'Edit Asset'});
          Origin.sidebar.addView(new AssetManagementNewAssetSidebarView().$el);
          Origin.contentPane.setView(AssetManagementNewAssetView, { model: Asset });
        }
      });
    }
  });

  Origin.on('globalMenu:assetManagement:open', function() {
    Origin.router.navigate('#/assetManagement', {trigger: true});
  });

  Origin.on('app:dataReady login:changed', function() {
    Origin.globalMenu.addItem({
      "location": "global",
      "text": window.polyglot.t('app.assetmanagement'),
      "icon": "fa-file-image-o",
      "callbackEvent": "assetManagement:open",
      "sortOrder": 2
    });
  });
});
