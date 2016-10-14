// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var _ = require('underscore');
  var Origin = require('coreJS/app/origin');
  var AssetModel = require('coreJS/assetManagement/models/assetModel');
  var AssetManagementCollectionView = require('coreJS/assetManagement/views/assetManagementCollectionView');
  var AssetManagementRefineView = require('coreJS/assetManagement/views/assetManagementRefineView');
  var AssetManagementView = require('coreJS/assetManagement/views/assetManagementView');
  var AssetManagementModalNewAssetView = require('coreJS/assetManagement/views/assetManagementModalNewAssetView');

  var AssetManagementModalView = AssetManagementView.extend({
    preRender: function(options) {
      this.isModal = true;
  	  this.options = options;
  	  AssetManagementView.prototype.preRender.apply(this, arguments);

      this.listenTo(Origin, 'assetManagement:assetItemView:preview', this.onPreview);
      this.listenTo(Origin, 'assetManagement:modal:update', this.onAssetUpdate);
      this.listenTo(Origin, 'assetManagement:refine:show', this.onRefineShow);
    },

    setupSubViews: function() {
      this.setUpCollectionView();
      this.setUpNewAssetButton();
      this.setUpRefineView();
    },

    setUpCollectionView: function() {
      // Replace Asset and : so we can have both filtered and all asset types
      var assetType = this.options.assetType.replace('Asset', '').replace(':', '');
      // asset type filter
      var search = (assetType) ? { assetType: { $in: [assetType] } } : {};
      // Push collection through to collection view
      this.collectionView = new AssetManagementCollectionView({ collection: this.collection, search: search, isModal:this.isModal });
      this.$('.asset-management-assets-container-inner').append(this.collectionView.$el);
    },

    setUpRefineView: function() {
      this.$('.asset-management-assets-container-inner').hide();
      this.$('.asset-management-inner').prepend(new AssetManagementRefineView().$el);
    },

    setUpNewAssetButton: function() {
      var buttonTemplate = Handlebars.templates['assetManagementNewAssetButton'];
      $('.modal-popup-toolbar-buttons').prepend(buttonTemplate());
      $('.modal-popup-toolbar-buttons button.add-asset').click(_.bind(this.onNewAssetClicked, this));
    },

    resizeAssetPanels: function() {
      var actualHeight = $('.modal-popup').outerHeight()-$('.modal-popup-toolbar').outerHeight();
      this.$('.asset-management-assets-container').height(actualHeight);
      this.$('.asset-management-preview-container').height(actualHeight);

      // let everyone know the new dimensions
      Origin.trigger('modal:resize', {
        width: $('.modal-popup').outerWidth(),
        height: actualHeight
      });
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
    },

    onNewAssetClicked: function(e) {
      event && event.preventDefault();
      if($('asset-management-modal-new-asset').length === 0) {
        Origin.trigger('assetManagement:refine:hide');
        Origin.trigger('assetManagement:assetPreviewView:delete');
        Origin.trigger('assetManagement:refine:hide');
        var newAssetView = new AssetManagementModalNewAssetView({model: new AssetModel()});
        $('.asset-management-inner').append(newAssetView.$el);
      }
    },

    onRefineReady: function() {
      AssetManagementView.prototype.onRefineReady.apply(this, arguments);
      this.$('.asset-management-assets-container-inner').fadeIn();
    },

    onRefineShow: function() {
      // this forces new asset overlay to close
      Origin.trigger('assetManagement:modal:newAssetOpened');
    },

    onPreview: function(data) {
      // this forces new asset overlay to close
      Origin.trigger('assetManagement:modal:newAssetOpened');
    }
  });

  return AssetManagementModalView;
});
