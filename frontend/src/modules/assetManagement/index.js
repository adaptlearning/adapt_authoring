// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var AssetCollection = require('./collections/assetCollection');
  var AssetManagementNewAssetView = require('./views/assetManagementNewAssetView');
  var AssetManagementNewAssetSidebarView = require('./views/assetManagementNewAssetSidebarView');
  var AssetManagementSidebarView = require('./views/assetManagementSidebarView');
  var AssetManagementView = require('./views/assetManagementView');
  var AssetModel = require('./models/assetModel');
  var TagsCollection = require('core/collections/tagsCollection');

  Origin.on('origin:dataReady login:changed', function() {
    Origin.globalMenu.addItem({
      "location": "global",
      "text": Origin.l10n.t('app.assetmanagement'),
      "icon": "fa-file-image-o",
      "callbackEvent": "assetManagement:open",
      "sortOrder": 2
    });
  });

  Origin.on('globalMenu:assetManagement:open', function() {
    Origin.router.navigateTo('assetManagement');
  });

  Origin.on('router:assetManagement', function(location, subLocation, action) {
    Origin.assetManagement = {
      filterData: {}
    };
    if(!location) return loadAssetsView();
    if(location === 'new') return loadNewAssetView();
    if(subLocation === 'edit') loadEditAssetView(location);
  });

  function loadAssetsView() {
    (new TagsCollection()).fetch({
      success: function(tagsCollection) {
        // Load asset collection before so sidebarView has access to it
        var assetCollection = new AssetCollection();
        // No need to fetch as the collectionView takes care of this
        // Mainly due to serverside filtering
        Origin.trigger('location:title:hide');
        Origin.sidebar.addView(new AssetManagementSidebarView({ collection: tagsCollection }).$el);
        Origin.contentPane.setView(AssetManagementView, { collection: assetCollection });
        Origin.trigger('assetManagement:loaded');
      },
      error: function() {
        console.log('Error occured getting the tags collection - try refreshing your page');
      }
    });
  }

  function loadNewAssetView() {
    Origin.trigger('location:title:update', { title: 'New Asset' });
    Origin.sidebar.addView(new AssetManagementNewAssetSidebarView().$el);
    Origin.contentPane.setView(AssetManagementNewAssetView, { model: new AssetModel });
  }

  function loadEditAssetView(location) {
    // Fetch existing asset model
    (new AssetModel({ _id: location })).fetch({
      success: function(model) {
        Origin.trigger('location:title:update', { title: 'Edit Asset' });
        Origin.sidebar.addView(new AssetManagementNewAssetSidebarView().$el);
        Origin.contentPane.setView(AssetManagementNewAssetView, { model: model });
      }
    });
  }
});
