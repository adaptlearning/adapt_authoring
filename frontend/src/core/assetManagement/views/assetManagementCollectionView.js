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
            this.assetDenominator = 12;
            this.filters = [];
            this.collection = new AssetCollection();
            this.listenTo(this.collection, 'sync', this.renderAssetItems);
            this.listenTo(Origin, 'assetManagement:sidebarFilter:add', this.addFilter);
            this.listenTo(Origin, 'assetManagement:sidebarFilter:remove', this.removeFilter);
            this.listenTo(Origin, 'assetManagement:sidebarView:filter', this.filterBySearchInput);
        },

        renderAssetItems: function(filteredCollection) {
            
            // Always reset the currentAssetLimit of assets
            this.currentAssetLimit = 0;
            this.assetCollection = (filteredCollection || this.collection);

            // Check if collection has items and hide instructions
            if (this.assetCollection.length > 0) {
                $('.asset-management-no-assets').addClass('display-none');
            }

            // Trigger event to kill zombie views
            Origin.trigger('assetManagement:assetViews:remove');
            // Empty collection container
            this.$('.asset-management-collection-inner').empty();

            // This is used as a switch
            var hasSetupLazyLoading = false;
            // Render each asset item
            this.assetCollection.each(function(asset) {
                // Work out if this.assetLimit has been set
                this.assetLimit = (this.assetLimit || this.assetDenominator);
                // Check if the asset limit has been reached
                if (this.currentAssetLimit >= this.assetLimit) {
                    // Only if the collection is bigger then the currentAssetLimit 
                    // setup the scroll listener
                    if (this.assetCollection.length > this.currentAssetLimit && !hasSetupLazyLoading) {
                        hasSetupLazyLoading = true;
                        this.setupLazyScrolling();
                    }
                    return;
                }
                this.currentAssetLimit ++;
                this.$('.asset-management-collection-inner').append(new AssetItemView({model: asset}).$el);

            }, this);

            // Should always check if input has a value and keep the search filter
            this.filterBySearchInput($('.asset-management-sidebar-filter-search').val());

        },

        setupLazyScrolling: function() {

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
            
        },

        lazyRenderCollection: function() {
            // Check if the currentAssetLimit is greater than the asset collection length
            // if so - remove the scroll event
            if (this.currentAssetLimit >= this.assetCollection.length) {
                this.removeLazyScrolling();
                return;
            }
            // Adjust limit based upon the denominator
            this.assetLimit += this.assetDenominator;
            this.assetCollection.each(function(asset, index) {
                // Check if the asset limit has been reached
                if (this.currentAssetLimit >= this.assetLimit || index < this.currentAssetLimit) {
                    return;
                }
                this.currentAssetLimit ++;
                this.$('.asset-management-collection-inner').append(new AssetItemView({model: asset}).$el);

            }, this);
        },

        postRender: function() {
            this.collection.fetch();
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
            // If this.filters is empty then no filters are applied
            // Instead render all items
            if (this.filters.length === 0) {
                return this.renderAssetItems(this.collection);
            }

            // Filter collection based upon this.filters array
            var filteredCollection = this.collection.filter(function(assetItem) {

                return _.contains(this.filters, assetItem.get('assetType'));

            }, this);

            // Once filter re-render the view
            // Why re-render is so we can use search on the dom elements whilst keeping
            // the filter separate
            this.renderAssetItems(new Backbone.Collection(filteredCollection));

        },

        filterBySearchInput: function(filterText) {
            // Go through each model and hide the ones with this title
            this.collection.each(function(model) {
                if (model.get('title').toLowerCase().indexOf(filterText.toLowerCase()) > -1) {
                    this.$('.id-' + model.get('_id')).removeClass('display-none');
                } else {
                    this.$('.id-' + model.get('_id')).addClass('display-none');
                }

            }, this);
        },

        removeLazyScrolling: function() {
            $('.asset-management-assets-container').off('scroll');
        }

    }, {
        template: 'assetManagementCollection'
    });

    return AssetCollectionView;

});
