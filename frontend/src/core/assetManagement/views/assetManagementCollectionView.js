define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');
  var AssetItemView = require('coreJS/assetManagement/views/assetManagementItemView');
  var AssetCollection = require('coreJS/assetManagement/collections/assetCollection');
  var AssetModel = require('coreJS/assetManagement/models/assetModel');
  var AssetManagementPreview = require('coreJS/assetManagement/views/assetManagementPreviewView');

  var AssetCollectionView = OriginView.extend({

    tagName: "div",

    className: "asset-management-collection",

    events: {},

    preRender: function() {
        this.collection = new AssetCollection();
        this.listenTo(this.collection, 'sync', this.setupFilteredCollection);
      
      /*this.listenTo(Origin, 'assets:update', this.refreshCollection);
      this.listenTo(Origin, 'assetItemView:preview', this.loadPreview);
      this.listenTo(Origin, 'assetManagement:filter', this.filterCollection);*/
    },

    setupFilteredCollection: function() {
        // Check if collection has items and hide instructions
        if (this.collection.length > 0) {
            $('.asset-management-no-assets').addClass('display-none');
        }
        // Empty collection container
        this.$('.asset-management-collection-inner').empty();

        this.collection.each(function(asset) {
            this.$('.asset-management-collection-inner').append(new AssetItemView({model: asset}).$el);
        }, this);
    },

    postRender: function() {
        this.collection.fetch();
      /*this.addNewAssetContainer();
      this.setCollectionHeight();*/
    },

    /*refreshCollection: function(event) {
      this.collection.fetch();
    },

    filterCollection: function(event) {
      if (Origin.assetManagement.filterData && !$.isEmptyObject(Origin.assetManagement.filterData)) {
        var partialString = Origin.assetManagement.filterData.searchString;
        var assetTypes = Origin.assetManagement.filterData.assetType;

        this.filteredCollection = new Backbone.Collection(this.collection.filter(function (model) {

          if (partialString !== '') {
            if (assetTypes.length > 0) {
              return _.contains(assetTypes, model.get('assetType')) && model.get('title').toLowerCase().indexOf(partialString) >= 0;
            } else {
              return model.get('title').toLowerCase().indexOf(partialString) >= 0;
            }
          } else {
            return _.contains(assetTypes, model.get('assetType'));
          }

        }));
      } else {
        // There is no filter applied
        this.filteredCollection = this.collection;
      }

      this.addAssetViews();
    },

    addNewAssetContainer: function() {
      //this.$('.new-asset-container').append(new AssetView({model: new AssetModel()}).$el);
    },

    addAssetViews: function() {
      this.renderAssetViews(this.filteredCollection.models);
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
    },

    setCollectionHeight: function () {
      var offset = this.$('.assets-container').offset();
      this.$('.assets-container').height($(window).height() - ($('.navigation').outerHeight() + offset.top));
    }*/

  }, {
    template: 'assetManagementCollection'
  });

  return AssetCollectionView;

});
