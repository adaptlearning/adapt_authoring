define(function(require){

    var Backbone = require('backbone');
    var Handlebars = require('handlebars');
    var Origin = require('coreJS/app/origin');
    var OriginView = require('coreJS/app/views/originView');
    var AssetItemView = require('coreJS/assetManagement/views/assetManagementItemView');
    var AssetCollection = require('coreJS/assetManagement/collections/assetCollection');
    var AssetModel = require('coreJS/assetManagement/models/assetModel');
    var AssetManagementPreview = require('coreJS/assetManagement/views/assetManagementPreviewView');

    var AssetCollectionView = OriginView.extend({

        tagName: "div",

        className: "asset-management-collection",

        events: {},

        preRender: function() {
            this.sort = { createdAt: -1 };
            this.search = {};
            this.assetLimit = 0;
            this.assetDenominator = 16;
            this.filters = [];
            this.collection = new AssetCollection();
            this.listenTo(this.collection, 'sync', this.onCollectionSynced);
            this.listenTo(this.collection, 'add', this.appendAssetItem);
            this.listenTo(Origin, 'assetManagement:sidebarFilter:add', this.addFilter);
            this.listenTo(Origin, 'assetManagement:sidebarFilter:remove', this.removeFilter);
            this.listenTo(Origin, 'assetManagement:sidebarView:filter', this.filterBySearchInput);
        },

        onCollectionSynced: function () {
          if (this.collection.length) {
            $('.asset-management-no-assets').addClass('display-none');
          } 
        },

        setupLazyScrolling: function() {
            if (this.hasSetUpLazyScrolling) {
              return;
            }
            
            var $assetContainer = $('.asset-management-assets-container');
            var $assetContainerInner = $('.asset-management-assets-container-inner');
            // Remove event before attaching
            $assetContainer.off('scroll');

            $assetContainer.on('scroll', _.bind(function() {
                var scrollTop = $assetContainer.scrollTop();
                var scrollableHeight = $assetContainerInner.height();
                var containerHeight = $assetContainer.height();

                // If the scroll position of the assets container is
                // near the bottom
                if ((scrollableHeight-containerHeight) - scrollTop < 30) {
                    this.lazyRenderCollection();
                }

            }, this));
            this.hasSetUpLazyScrolling = true;
        },
        
        updateCollection: function (reset) {
            // If removing items, we need to reset our limits
            if (reset) {
              // Trigger event to kill zombie views
              Origin.trigger('assetManagement:assetViews:remove');
            
              // Empty collection container
              this.$('.asset-management-collection-inner').empty();
              
              this.assetLimit = 0;
              this.collection.reset();
            }
            
            this.collection.fetch({ 
              remove: reset,
              data: { 
                search: this.search,
                operators : { 
                  skip: this.assetLimit, 
                  limit: this.assetDenominator,
                  sort: this.sort
                } 
              } 
            });
        },
        
        appendAssetItem: function (asset) {
          this.$('.asset-management-collection-inner').append(new AssetItemView({ model: asset }).$el);
        },

        lazyRenderCollection: function() {
            // Adjust limit based upon the denominator
            this.assetLimit += this.assetDenominator;
            this.updateCollection();
        },

        postRender: function() {
            this.setupLazyScrolling();
            this.updateCollection();

            // Fake a scroll trigger - just incase the limit is too low and no scroll bars
            $('.asset-management-assets-container').trigger('scroll');
        },

        addFilter: function(filterType) {
            // add filter to this.filters
            this.filters.push(filterType);
            this.filterCollection();
        },

        removeFilter: function(filterType) {
            // remove filter from this.filters
            this.filters = _.filter(this.filters, function(item) {
                return item != filterType;
            });

            this.filterCollection();
        },

        filterCollection: function(event) {
            this.search.assetType = this.filters.length
                ? { $in: this.filters }
                : null ;
            this.updateCollection(true);
        },

        filterBySearchInput: function (filterText) {
            this.search = { title: '.*' + filterText.toLowerCase() + '.*' };
            this.updateCollection(true);
        },

        removeLazyScrolling: function() {
            $('.asset-management-assets-container').off('scroll');
        }

    }, {
        template: 'assetManagementCollection'
    });

    return AssetCollectionView;

});
