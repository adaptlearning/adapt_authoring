// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('coreJS/app/origin');
  var AssetManagementCollectionView = require('coreJS/assetManagement/views/assetManagementCollectionView');
  var AssetManagementView = require('coreJS/assetManagement/views/assetManagementView');
  var AssetManagementModalFiltersView = require('coreJS/assetManagement/views/assetManagementModalFiltersView');
  var AssetManagementModelAutofillView = require('coreJS/assetManagement/views/assetManagementModalAutofillView');

  var AssetManagementModalView = AssetManagementView.extend({
    preRender: function(options) {
  	  this.options = options;
  	  AssetManagementView.prototype.preRender.apply(this, arguments);

      this.listenTo(Origin, 'assetManagement:modal:update', this.onAssetUpdate);
    },

    setupSubViews: function() {
      new AssetManagementModalFiltersView(this.options);

      // TODO enable this for other components
  	  var isImageForGraphic = this.options.assetType === "Asset:image" && Origin.scaffold.getCurrentModel().get('_component') === 'graphic';
      if (isImageForGraphic) new AssetManagementModelAutofillView({ modalView: this });

      // Replace Asset and : so we can have both filtered and all asset types
      var assetType = this.options.assetType.replace('Asset', '').replace(':', '');
      // asset type filter
      if (assetType) {
        this.search = { assetType: { $in: [ assetType ] } };
      }
      // Push collection through to collection view
      this.$('.asset-management-assets-container-inner').append(new AssetManagementCollectionView({ collection: this.collection, search: this.search, isModal:true }).$el);
    },

    resizeAssetPanels: function() {
      var navigationHeight = $('.navigation').outerHeight();
      var windowHeight = $(window).height();
      var actualHeight = windowHeight - (navigationHeight);
      this.$('.asset-management-assets-container').height(actualHeight);
      this.$('.asset-management-preview-container').height(actualHeight);
    },

    showPreview: function(model) {
      AssetManagementView.prototype.showPreview.apply(this, arguments);
  	  var assetObject = this.setData(model);
      Origin.trigger('modal:assetSelected', assetObject);
  	},

    setData: function(model, shouldAutofill) {
      this.data = {
        assetLink: 'course/assets/' + model.get('filename'),
        assetId: model.get('_id'),
        assetFilename: model.get('filename'),
        _shouldAutofill: shouldAutofill || false
      };
      return this.data;
    },

    getData: function() {
      return this.data;
    },

    onAssetUpdate: function(data) {
      this.setData(data.model, data._shouldAutofill);
      Origin.trigger('modal:onUpdate');
    }
  });

  return AssetManagementModalView;
});
