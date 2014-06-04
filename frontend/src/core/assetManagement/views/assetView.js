define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var OriginView = require('coreJS/app/views/originView');
  var Origin = require('coreJS/app/origin');

  var AssetView = OriginView.extend({

    tagName: 'div',

    className: 'asset units-row',

    events: {
      'submit .asset-form'          : 'uploadAsset',
      'change .asset-file'          : 'onChangeFile',
      'click .toggle-asset-form'    : 'toggleAssetForm',
      // 'click .cancel-button'        : 'toggleAssetForm',
      'click .asset-nav-tabs ul li' : 'switchTab',
      // 'click .asset-filter-option'  : 'toggleFilterSelection',
      'click .filterButton'         : 'filterAssets',
      'click .resetFilterButton'    : 'resetFilterForm'
    },

    preRender: function() {
      this.listenTo(Origin, 'asset:clearForm', this.resetUploadForm);
    },

    postRender: function() {
      this.$('.assets-container').css({height: $('#app').height()});
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
          view.resetUploadForm();

          // Origin.trigger('asset:clearForm');
          Origin.trigger('assets:update');

          alert('file uploaded');
          // view.toggleAssetForm();
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
      Origin.assetManagement.filterData.searchString = $.trim(stringValue);

      if (assetTypes.length != 0) {
        _.each(assetTypes, function(asset) {
          assetFilter.push(asset.value);
        });
      } 

      Origin.assetManagement.filterData.assetType = assetFilter;

      this.triggerFilter();
    },

    triggerFilter: function() {
      Origin.trigger('assetManagement:filter');
    },

    switchTab: function(e) {
      e.preventDefault();
      this.$('.asset-nav-tabs ul li a').removeClass('active');
      this.$(e.currentTarget).find('a').addClass('active');
      this.showTab(this.$(e.currentTarget).index());
    },

    showTab: function (tab) {
      this.$('.asset-tab-content').removeClass('active');
      this.$('.asset-tab-content').eq(tab).addClass('active');
    }
    
  }, {
    template: 'asset'
  });

  return AssetView;

});