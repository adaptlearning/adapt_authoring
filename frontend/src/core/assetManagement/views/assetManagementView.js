// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Backbone = require('backbone');
  var OriginView = require('coreJS/app/views/originView');
  var Origin = require('coreJS/app/origin');
  var AssetManagementCollectionView = require('coreJS/assetManagement/views/assetManagementCollectionView');
  var AssetManagementPreviewView = require('coreJS/assetManagement/views/assetManagementPreviewView');

  var AssetManagementView = OriginView.extend({
    tagName: 'div',
    className: 'asset-management',

    preRender: function() {
        this.listenTo(Origin, 'window:resize', this.resizeAssetPanels);
        this.listenTo(Origin, 'assetManagement:assetItemView:preview', this.showPreview);
        this.listenTo(Origin, 'assetManagement:assetPreviewView:delete', this.hidePreview);
        this.listenTo(Origin, 'assetManagement:refine:ready', this.onRefineReady);
    },

    postRender: function() {
        this.setupSubViews();
        _.defer(_.bind(function() {
          this.resizeAssetPanels();
          this.$el.imageready(this.setViewToReady);
        }, this));
    },

    setupSubViews: function() {
        this.collectionView = new AssetManagementCollectionView({ collection: this.collection });
        this.$('.asset-management-assets-container-inner').append(this.collectionView.$el);
    },

    resizeAssetPanels: function() {
        var navigationHeight = $('.navigation').outerHeight();
        var locationTitleHeight = $('.location-title').outerHeight();
        var actualHeight = $(window).height() - (navigationHeight + locationTitleHeight);
        this.$('.asset-management-assets-container').height(actualHeight);
        this.$('.asset-management-preview-container').height(actualHeight);
    },

    showPreview: function(model) {
      var $container = this.$('.asset-management-preview-container-inner');
      this.$('.asset-management-no-preview').hide();
      var previewView = new AssetManagementPreviewView({ model: model });
      $container.html(previewView.$el);
      this.$('.asset-management-preview-container').addClass('show');
    },

    hidePreview: function() {
      this.$('.asset-management-preview-container').removeClass('show');
    },

    onRefineReady: function() {
      // make sure we've got the latest asset list
      Origin.trigger('assetManagement:sidebarFilter:add');
      // start listening for filters now we're ready
      this.listenTo(Origin, 'assetManagement:refine:apply', this.onRefineApply);
    },

    /*
    * TODO this basically forces a fetch, and searches on server side.
    * Seems inefficient...
    */
    onRefineApply: function(filter) {
      switch(filter.type) {
        case 'search':
          this.collectionView[filter.type] = _.extend(this.collectionView[filter.type], filter.options);
          break;
        case 'sort':
        case 'tags':
          this.collectionView[filter.type] = filter.options;
          break;
      }
      Origin.trigger('assetManagement:sidebarFilter:add');
    }
  }, {
    template: 'assetManagement'
  });

  return AssetManagementView;
});
