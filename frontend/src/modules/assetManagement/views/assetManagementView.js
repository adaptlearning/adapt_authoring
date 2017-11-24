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
        'window:resize': this.resizePanels,
        'assetManagement:assetItemView:preview': this.onAssetClicked,
        'assetManagement:assetPreviewView:delete': this.onAssetDeleted
      });
    },

    postRender: function() {
      var view = new AssetManagementCollectionView({ collection: this.collection });
      this.$('.asset-management-assets-container-inner').append(view.$el);

      this.resizePanels();
      // defer setting ready status until images are ready
      _.defer(function() {
        view.$el.imageready(this.setViewToReady);
      });
    },

    resizePanels: function() {
      var navigationHeight = $('.navigation').outerHeight();
      var locationTitleHeight = $('.location-title').outerHeight();
      var windowHeight = $(window).height();
      var actualHeight = windowHeight - (navigationHeight + locationTitleHeight);
      var paneWidth = $('.asset-management').outerWidth();
      this.$('.asset-management-assets-container')
        .height(actualHeight)
        .width(paneWidth*0.75);
      this.$('.asset-management-preview-container')
        .height(actualHeight)
        .width(paneWidth*0.25);
    },

    onAssetClicked: function(model) {
      this.$('.asset-management-no-preview').hide();

      var view = new AssetManagementPreviewView({ model: model });
      this.$('.asset-management-preview-container-inner').html(view.$el);
    },

    onAssetDeleted: function() {
      this.$('.asset-management-no-preview').show();
    }
  }, {
    template: 'assetManagement'
  });

  return AssetManagementView;
});
