// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('coreJS/app/origin');
  var AssetModel = require('coreJS/assetManagement/models/assetModel');
  var AssetCollection = require('coreJS/assetManagement/collections/assetCollection');
  var AssetManagementView = require('coreJS/assetManagement/views/assetManagementView');
  var AssetManagementSidebarView = require('coreJS/assetManagement/views/assetManagementSidebarView');
  var AssetManagementNewAssetView = require('coreJS/assetManagement/views/assetManagementNewAssetView');
  var AssetManagementNewAssetSidebarView = require('coreJS/assetManagement/views/assetManagementNewAssetSidebarView');
  var TagsCollection = require('coreJS/tags/collections/tagsCollection');

  Origin.on('app:dataReady login:changed', function() {
    Origin.globalMenu.addItem({
      "location": "global",
      "text": "Asset Management",
      "icon": "fa-file-image-o",
      "callbackEvent": "assetManagement:open",
      "sortOrder": 2
    });
  });

  Origin.on('globalMenu:assetManagement:open', function() {
    Origin.router.navigate('#/assetManagement', {trigger: true});
  });

  Origin.on('router:assetManagement', function(location, subLocation, action) {
    Origin.assetManagement = {
      filterData: {}
    };
    // load the right view...
    if (!location) loadCollectionView();
    else if (location === 'new') loadAssetView();
    else if (subLocation === 'edit') loadAssetView(location);
  });

  function loadCollectionView() {
      var tagsCollection = new TagsCollection();
      tagsCollection.fetch({
        success: function() {
          // Load asset collection before so sidebarView has access to it
          var assetCollection = new AssetCollection();
          // No need to fetch as the collectionView takes care of this
          // Mainly due to serverside filtering
          Origin.trigger('location:title:hide');
          Origin.sidebar.addView(new AssetManagementSidebarView({ collection: tagsCollection}).$el );
          Origin.router.createView(AssetManagementView, { collection: assetCollection });
          Origin.trigger('assetManagement:loaded');
        },
        error: function() {
          console.log('Error occured getting the tags collection - try refreshing your page');
        }
      });
    };

    function loadAssetView(id) {
      var isNew = id === undefined;
      // TODO localise this
      var title = isNew ? 'New Asset' : 'Edit Asset';
      Origin.trigger('location:title:update', { title: title} );

      var data = isNew ? {} : { _id: id };
      var model = new AssetModel(data);

      if(isNew) loadView();
      else model.fetch({ success:loadView });

      function loadView() {
        Origin.sidebar.addView(new AssetManagementNewAssetSidebarView().$el, {
            "backButtonText": "Back to assets",
            "backButtonRoute": "/#/assetManagement"
        });
        Origin.router.createView(AssetManagementNewAssetView, { model: model });
      };
    };
});
