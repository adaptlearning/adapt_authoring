define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var OriginView = require('coreJS/app/views/originView');
  var Origin = require('coreJS/app/origin');
  var AssetModel = require('coreJS/assetManagement/models/assetModel');
  var AssetManagementCollectionView = require('coreJS/assetManagement/views/assetManagementCollectionView');
  var AssetManagementPreviewView = require('coreJS/assetManagement/views/assetManagementPreviewView');

  var AssetManagementView = OriginView.extend({

    tagName: 'div',

    className: 'asset-management',

    events: {
    },

    preRender: function() {
        this.listenTo(Origin, 'window:resize', this.resizeAssetPanels);
        this.listenTo(Origin, 'assetManagement:assetItemView:preview', this.onAssetClicked)
        /*Origin.trigger('assetItemView:preview', this.model);*/
    },

    postRender: function() {
        this.setupSubViews();
        this.resizeAssetPanels();
        // Set imageReady
        _.defer(_.bind(this.setupImageReady, this));
        this.setViewToReady();
    },

    setupImageReady: function() {
      this.$el.imageready(this.setViewToReady);
    },

    setupSubViews: function() {
        this.$('.asset-management-assets-container-inner').append(new AssetManagementCollectionView().$el);
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
        this.$('.asset-management-preview-container-inner').html(new AssetManagementPreviewView({
            model: model
        }).$el);
    }
    
  }, {
    template: 'assetManagement'
  });

  return AssetManagementView;

});
