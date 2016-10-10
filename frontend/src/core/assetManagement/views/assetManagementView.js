// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
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
        this.setUpAdminTools();

        this.listenTo(Origin, 'window:resize', this.resizeAssetPanels);
        this.listenTo(Origin, 'assetManagement:assetItemView:preview', this.onAssetClicked);
        this.listenTo(Origin, 'assetManagement:assetPreviewView:delete', this.onAssetDeleted);
    },

    setUpAdminTools: function() {
      Origin.trigger('superToolbar:add', [{
        title: 'Build thumbs',
        icon: 'fa-wrench',
        event: 'buildthumbs'
      }]);
      this.listenTo(Origin, 'superToolbar:buildthumbs', function() {
        $.post('api/asset/buildthumbs', function(data, textStatus, jqXHR) {
          Origin.Notify.alert({ type: 'info', text: 'Thumbnails built successfully!' });
        });
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
        this.$('.asset-management-assets-container-inner').append(new AssetManagementCollectionView({collection: this.collection}).$el);
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
    },

    onAssetDeleted: function() {
        this.$('.asset-management-no-preview').show();
    }

  }, {
    template: 'assetManagement'
  });

  return AssetManagementView;

});
