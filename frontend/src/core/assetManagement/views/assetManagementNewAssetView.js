define(function(require){

  var Backbone = require('backbone');
  var OriginView = require('coreJS/app/views/originView');
  var Origin = require('coreJS/app/origin');
  var AssetModel = require('coreJS/assetManagement/models/assetModel');

  var AssetManagementNewAssetView = OriginView.extend({

    className: 'asset-management-new-asset',

    events: {
      'change .asset-file'          : 'onChangeFile',
    },

    preRender: function() {
        this.listenTo(Origin, 'assetManagement:newAsset', this.uploadAsset);
    },

    postRender: function() {
    },

    onChangeFile: function(event) {
      var $title = this.$('.asset-title');

      // Default 'title' -- remove C:\fakepath if it is added
      $title.val(this.$('.asset-file')[0].value.replace("C:\\fakepath\\", ""));
    },

    uploadAsset: function() {

      this.uploadFile();

      // Return false to prevent the page submitting
      return false;
    },

    uploadFile: function() {

      this.$('.asset-form').ajaxSubmit({
        error: function(xhr, status, error) {
          console.log('Error: ' + xhr.status);
        },
    
        success: function(data, status, xhr) {
          Origin.trigger('assets:update');
            
          asset = new AssetModel({_id: data._id});
          asset.fetch().done(function (data) {
            Origin.trigger('assetItemView:preview', asset);
          });

          Origin.router.navigate('#/assetManagement', {trigger:true});
        }
      });

      // Return false to prevent the page submitting
      return false;
    }
    
  }, {
    template: 'assetManagementNewAsset'
  });

  return AssetManagementNewAssetView;

});
