define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');
  var AssetItemView = require('coreJS/assetManagement/views/assetItemView');
  var AssetCollection = require('coreJS/assetManagement/collections/assetCollection');
  var AssetView = require('coreJS/assetManagement/views/assetView');
  var AssetModel = require('coreJS/assetManagement/models/assetModel');
  var AssetPreview = require('coreJS/assetManagement/views/assetPreviewView');

  var AssetCollectionView = OriginView.extend({

    tagName: "div",

    className: "asset-list",

    events: {},

    preRender: function() {
      this.collection = new AssetCollection();
      this.collection.fetch();
      
      this.listenTo(this.collection, 'sync', this.addAssetViews);
      this.listenTo(Origin, 'assets:update', this.refreshCollection);
      this.listenTo(Origin, 'assetItemView:preview', this.loadPreview);
    },

    postRender: function() {
      this.addNewAssetContainer();
    },

    refreshCollection: function(event) {
      this.collection.fetch();
    },

    addNewAssetContainer: function() {
      this.$('.new-asset-container').append(new AssetView({model: new AssetModel()}).$el);
    },

    addAssetViews: function() {
      this.renderAssetViews(this.collection.models);
    },

    renderAssetViews: function(assets) {
      this.$('.assets-container').empty();

      _.each(assets, function(asset) {
        this.$('.assets-container').append(new AssetItemView({model: asset}).$el);
      }, this);

      this.evaluateAssetCount(assets);
    },

    evaluateAssetCount: function (assets) {
      if (assets.length == 0) {
        this.$('.assets-container').append(window.polyglot.t('app.noassetsfound'));
      }
    },

    loadPreview: function (previewModel) {
      this.$('.asset-preview').empty().append(new AssetPreview({model: previewModel}).$el);
    }

  }, {
    template: 'assetOverview'
  });

  return AssetCollectionView;

});
