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
    // used to delay event triggering
    filterTimer: -1,
    filterTimeout: 750,

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
      // set data
      model.set({
        isEditable: !this.isModal,
        isSelectable: this.isModal
      });
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
      // start listening for filters now we're ready
      this.listenTo(Origin, 'assetManagement:refine:apply', this.onRefineApply);
    },

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
      /*
      * delay event trigger to allow for filter stacking (less fetches)
      */
      if(this.filterTimer) {
        clearTimeout(this.filterTimer);
      }
      this.filterTimer = setTimeout(function() {
        Origin.trigger('assetManagement:sidebarFilter:add');
      }, this.filterTimeout);
    }
  }, {
    template: 'assetManagement'
  });

  return AssetManagementView;
});
