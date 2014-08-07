define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var OriginView = require('coreJS/app/views/originView');
  var Origin = require('coreJS/app/origin');
  var AssetModel = require('coreJS/assetManagement/models/assetModel');
  var AssetManagementCollectionView = require('coreJS/assetManagement/views/assetCollectionView');

  var AssetManagementView = OriginView.extend({

    tagName: 'div',

    className: 'asset-management',

    events: {
    },

    preRender: function() {
    },

    postRender: function() {
        this.addAssets();
    },

    addAssets: function() {
        this.$('asset-management-inner').append(new AssetManagementCollectionView().$el);
    },

    resetFilterForm: function(event) {
      event.preventDefault();

      // Reset the filter criteria object
      Origin.assetManagement.filterData = {};

      // Reset the UI
      this.$('.filter-form').trigger('reset');

      this.triggerFilter();
    },

    resetUploadForm: function() {
      this.$('.asset-form').trigger("reset");
    },

    onChangeFile: function(event) {
      var $title = this.$('.asset-title');

      // Default 'title' -- remove C:\fakepath if it is added
      $title.val(this.$('.asset-file')[0].value.replace("C:\\fakepath\\", ""));
    },

    uploadAsset: function(event) {
      event.preventDefault();

      this.uploadFile();

      // Return false to prevent the page submitting
      return false;
    },

    uploadFile: function() {
      var view = this;

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

          view.resetUploadForm();

          alert('file uploaded');
        }
      });

      // Return false to prevent the page submitting
      return false;
    },

    toggleAssetForm: function(event) {
      if (event) {
        event.preventDefault();
      }
      this.$('.toggle-asset-form').toggleClass('display-none');
      this.$('.asset-form').slideToggle();
    },

    toggleFilterSelection: function(event) {
      event.preventDefault();

      var $control = $(event.target);

      if ($control.hasClass('selected')) {
        $control.removeClass('selected');
      } else {
        $control.addClass('selected');
      }
    },

    filterAssets: function(event) {
      event.preventDefault();

      var $searchControl = $('.input-search');
      // var assetTypes = $('ul.asset-filter.filetype > li.selected');
      var assetTypes = $(':checked');
      var stringValue = $.trim($searchControl.val());
      var assetFilter = [];
      
      Origin.assetManagement.filterData = {};
      Origin.assetManagement.filterData.searchString = stringValue;

      if (assetTypes.length != 0) {
        _.each(assetTypes, function(asset) {
          assetFilter.push(asset.value);
        });
      } 

      Origin.assetManagement.filterData.assetType = assetFilter;

      if (Origin.assetManagement.filterData.assetType.length == 0 && Origin.assetManagement.filterData.searchString == '') {
        // Reset the filter
        Origin.assetManagement.filterData = {};
      }

      this.triggerFilter();
    },

    triggerFilter: function() {
      Origin.trigger('assetManagement:filter');
    }
    
  }, {
    template: 'assetManagement'
  });

  return AssetManagementView;

});
