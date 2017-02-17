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

  Origin.on('app:dataReady login:changed', function() {
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
    Origin.assetManagement = { filterData: {} };
    if(!location) {
      loadCollectionView();
    }
    else if(location === 'new') {
      loadAssetView();
    }
    else if(subLocation === 'edit') {
      loadAssetView(location);
    }
  });

  function loadCollectionView() {
    // Sidebar needs access to collection, so create now
    new TagsCollection().fetch({
      success: function(tags) {
        Origin.trigger('location:title:hide');
        Origin.sidebar.addView(new AssetManagementSidebarView({ collection: tags }).$el);
        // Fetch is done in collectionView due to server-side filtering
        Origin.contentPane.setView(AssetManagementView, { collection: new AssetCollection() });
        Origin.trigger('assetManagement:loaded');
      },
      error: function() {
        Origin.Notify.alert({
          type: 'error',
          text: Origin.l10n.t('app.errorfetchingdata')
        });
      }
    });
  }

  function loadAssetView(id) {
    var isNew = id === undefined;
    var model = new AssetModel(isNew ? {} : { _id: id });

    if(isNew) loadView();
    else model.fetch({ success: loadView });

    function loadView() {
      Origin.trigger('location:title:update', { title: isNew ? Origin.l10n.t('app.newasset') : Origin.l10n.t('app.editasset') } );
      Origin.sidebar.addView(new AssetManagementNewAssetSidebarView().$el, {
        "backButtonText": Origin.l10n.t('app.backtoassets'),
        "backButtonRoute": "/#/assetManagement"
      });
      Origin.contentPane.setView(AssetManagementNewAssetView, { model: model });
    };
  }
});
