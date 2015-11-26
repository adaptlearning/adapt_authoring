// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){

    var Backbone = require('backbone');
    var Handlebars = require('handlebars');
    var Origin = require('coreJS/app/origin');
    var OriginView = require('coreJS/app/views/originView');
    var AssetItemView = require('coreJS/assetManagement/views/assetManagementItemView');
    var AssetModel = require('coreJS/assetManagement/models/assetModel');
    var AssetManagementPreview = require('coreJS/assetManagement/views/assetManagementPreviewView');

    var AssetCollectionView = OriginView.extend({

        tagName: "div",

        className: "asset-management-collection",

        events: {},

        preRender: function(options) {
            this.sort = { createdAt: -1 };
            this.search = (options.search || {});
            // Set to minus so we can have more DRY code
            this.assetLimit = -32;
            this.assetDenominator = 32;
            this.filters = (this.search.assetType) ? options.search.assetType.$in : [];
            this.tags = [];
            this.collectionLength = 0;
            this.shouldStopFetches = false;
            this.listenTo(this.collection, 'add', this.appendAssetItem);
            this.listenTo(Origin, 'assetManagement:sidebarFilter:add', this.addFilter);
            this.listenTo(Origin, 'assetManagement:sidebarFilter:remove', this.removeFilter);
            this.listenTo(Origin, 'assetManagement:sidebarView:filter', this.filterBySearchInput);
            this.listenTo(Origin, 'assetManagement:assetManagementSidebarView:filterByTags', this.filterByTags);
            this.listenTo(this.collection, 'sync', this.onCollectionSynced);
            this.listenTo(Origin, 'assetManagement:collection:refresh', this.updateCollection);
        },

        onCollectionSynced: function () {
            if (this.collection.length === 0) {
                $('.asset-management-no-assets').removeClass('display-none');
            } else {
                $('.asset-management-no-assets').addClass('display-none');
            }

            // FIX: Purely and lovingly put in for a rendering issue with chrome.
            // For when the items being re-rendering after a search return an 
            // amount of items that means the container is not scrollable
            if (this.assetLimit < this.assetDenominator) {
                $('.asset-management-assets-container').hide();
                _.delay(function() {
                    $('.asset-management-assets-container').show();
                }, 10);
            }

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
                    if (!this.isCollectionFetching) {
                        this.isCollectionFetching = true;
                        this.lazyRenderCollection();
                    }
                }

            }, this));
        },

        updateCollection: function (reset) {
            // If removing items, we need to reset our limits
            if (reset) {
              // Trigger event to kill zombie views
              Origin.trigger('assetManagement:assetViews:remove');

              // Reset fetches cache
              this.shouldStopFetches = false;

              this.assetLimit = 0;
              this.collectionLength = 0;
              this.collection.reset();
            }

            if (!Origin.permissions.hasPermissions(["*"])) {
                this.search = _.extend(this.search, {_isDeleted: false});
            } 

            this.search = _.extend(this.search, {
                tags: {
                    $in: this.tags
                }
            }, {
                assetType: {
                    $in: this.filters
                }
            });

            // This is set when the fetched amount is equal to the collection length
            // Stops any further fetches and HTTP requests
            if (this.shouldStopFetches) {
                return;
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
              },
              success: _.bind(function() {
                // On successful collection fetching set lazy render to enabled
                if (this.collectionLength === this.collection.length) {
                    this.shouldStopFetches = true;
                } else {
                    this.shouldStopFetches = false;
                    this.collectionLength = this.collection.length;
                }

                this.isCollectionFetching = false;
                Origin.trigger('assetManagement:assetManagementCollection:fetched');
              }, this)
            });
        },

        appendAssetItem: function (asset) {
            this.$('.asset-management-collection-inner').append(new AssetItemView({ model: asset }).$el);
        },

        lazyRenderCollection: function() {
            // Adjust limit based upon the denominator
            this.assetLimit += this.assetDenominator;
            this.updateCollection(false);
        },

        postRender: function() {
            this.setupLazyScrolling();

            // Fake a scroll trigger - just incase the limit is too low and no scroll bars
            $('.asset-management-assets-container').trigger('scroll');
            this.setViewToReady();
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

        filterCollection: function() {
            this.search.assetType = this.filters.length
                ? { $in: this.filters }
                : null ;
            this.updateCollection(true);
        },

        filterBySearchInput: function (filterText) {
            var pattern = '.*' + filterText.toLowerCase() + '.*';
            this.search = { title: pattern, description: pattern };
            this.updateCollection(true);

            $(".asset-management-modal-filter-search" ).focus();
        },

        removeLazyScrolling: function() {
            $('.asset-management-assets-container').off('scroll');
        },

        filterByTags: function(tags) {
            this.tags = _.pluck(tags, 'id');
            this.updateCollection(true);
        }

    }, {
        template: 'assetManagementCollection'
    });

    return AssetCollectionView;

});
