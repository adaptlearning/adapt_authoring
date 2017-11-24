// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');
  var AssetManagementCollectionView = require('./assetManagementCollectionView');
  var AssetManagementPreviewView = require('./assetManagementPreviewView');

  var AssetManagementView = OriginView.extend({
    tagName: 'div',
    className: 'asset-management',

    preRender: function() {
      this.listenTo(Origin, {
        'window:resize': this.resizeAssetPanels,
        'assetManagement:assetItemView:preview': this.onAssetClicked,
        'assetManagement:assetPreviewView:delete': this.onAssetDeleted
      });
    },

    postRender: function() {
      this.setupSubViews();
      this.resizeAssetPanels();
      // Set imageReady
      _.defer(_.bind(this.setupImageReady, this));
    },

    setupImageReady: function() {
      this.$el.imageready(this.setViewToReady);
    },

    setupSubViews: function() {
      // Push collection through to collection view
      this.$('.asset-management-assets-container-inner').append(new AssetManagementCollectionView({ collection: this.collection }).$el);
    },

    resizeAssetPanels: function() {
      var navigationHeight = $('.navigation').outerHeight();
      var locationTitleHeight = $('.location-title').outerHeight();
      var windowHeight = $(window).height();
      var actualHeight = windowHeight - (navigationHeight + locationTitleHeight);
      this.$('.asset-management-assets-container').height(actualHeight);
      this.$('.asset-management-preview-container').height(actualHeight);
    },

    onAssetClicked: function(model) {
      this.$('.asset-management-no-preview').hide();
      this.$('.asset-management-preview-container-inner').html(new AssetManagementPreviewView({ model: model }).$el);
    },

    onAssetDeleted: function() {
      this.$('.asset-management-no-preview').show();
    }
  }, {
    template: 'assetManagement'
  });

  return AssetManagementView;
});
