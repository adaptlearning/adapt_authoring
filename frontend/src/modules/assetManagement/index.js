// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var AssetModel = require('./models/assetModel');
  var AssetCollection = require('./collections/assetCollection');
  var AssetManagementView = require('./views/assetManagementView');
  var AssetManagementSidebarView = require('./views/assetManagementSidebarView');
  var AssetManagementNewAssetView = require('./views/assetManagementNewAssetView');
  var AssetManagementNewAssetSidebarView = require('./views/assetManagementNewAssetSidebarView');
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
    if(!location) loadAssetsView();
    else if(location === 'new') loadNewAssetView();
    else if (subLocation === 'edit') loadEditAssetView();
  });

  function loadAssetsView() {
    (new TagsCollection()).fetch({
      success: function(tags) {
        Origin.trigger('location:title:hide');
        Origin.sidebar.addView(new AssetManagementSidebarView({ collection: tags }).$el);
        // no fetch here, collectionView handles this to allow server-side filtering
        Origin.contentPane.setView(AssetManagementView, { collection: new AssetCollection() });
        Origin.trigger('assetManagement:loaded');
      },
      error: onFetchError
    });
  }

  function loadNewAssetView() {
    Origin.trigger('location:title:update', { title: Origin.l10n.t('app.newasset') });
    Origin.sidebar.addView(new AssetManagementNewAssetSidebarView().$el);
    Origin.contentPane.setView(AssetManagementNewAssetView, { model: new AssetModel });
  }

  function loadEditAssetView() {
    (new AssetModel({ _id: Origin.location.route1 })).fetch({
      success: function() {
        Origin.trigger('location:title:update', { title: Origin.l10n.t('app.editasset') });
        Origin.sidebar.addView(new AssetManagementNewAssetSidebarView().$el);
        Origin.contentPane.setView(AssetManagementNewAssetView, { model: Asset });
      },
      error: onFetchError
    });
  }

  function onFetchError(jqXHR) {
    Origin.Notify.alert({
      type: 'error',
      text: Origin.l10n.t('app.errorfetchingdata')
    });
  }
});
