// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var AssetModel = require('coreJS/assetManagement/models/assetModel');
  var AssetManagementCollectionView = require('coreJS/assetManagement/views/assetManagementCollectionView');
  var AssetManagementPreviewView = require('coreJS/assetManagement/views/assetManagementPreviewView');
  var AssetManagementView = require('coreJS/assetManagement/views/assetManagementView');
  var AssetManagementModalFiltersView = require('coreJS/assetManagement/views/assetManagementModalFiltersView');
  var AssetManagementModelAutofillView = require('coreJS/assetManagement/views/assetManagementModalAutofillView');

  var AssetManagementModalView = AssetManagementView.extend({
    preRender: function(options) {
  	  this.options = options;
  	  AssetManagementView.prototype.preRender.apply(this, arguments);
    },

    postRender: function() {
      this.setupSubViews();
      this.setupFilterAndSearchView();
      // TODO enable this for others
  	  var isImageForGraphic = this.options.assetType === "Asset:image" && Origin.scaffold.getCurrentModel().get('_component') === 'graphic';
      if (isImageForGraphic) this.setupImageAutofillButton();

      this.resizeAssetPanels();
    },

    setupSubViews: function() {
      // Replace Asset and : so we can have both filtered and all asset types
      var assetType = this.options.assetType.replace('Asset', '').replace(':', '');
      // asset type filter
      if (assetType) {
        this.search = {
          assetType: {
            $in: [ assetType ]
          }
        };
      }
      // Push collection through to collection view
      this.$('.asset-management-assets-container-inner').append(new AssetManagementCollectionView({ collection: this.collection, search: this.search }).$el);
    },

    setupFilterAndSearchView: function() {
      new AssetManagementModalFiltersView(this.options);
    },

    setupImageAutofillButton: function() {
      new AssetManagementModelAutofillView({ modalView: this });
    },

    resizeAssetPanels: function() {
      var navigationHeight = $('.navigation').outerHeight();
      var windowHeight = $(window).height();
      var actualHeight = windowHeight - (navigationHeight);
      this.$('.asset-management-assets-container').height(actualHeight);
      this.$('.asset-management-preview-container').height(actualHeight);
    },

    onAssetClicked: function(model) {
      this.$('.asset-management-no-preview').hide();
      this.$('.asset-management-preview-container-inner').html(new AssetManagementPreviewView({ model: model }).$el);

  	  var assetObject = {
        assetLink: 'course/assets/' + model.get('filename'),
        assetId: model.get('_id'),
        assetFilename: model.get('filename')
      };
      this.data = assetObject;
      Origin.trigger('modal:assetSelected', assetObject);
  	},

    getData: function() {
      return this.data;
    }
  });

  return AssetManagementModalView;
});
