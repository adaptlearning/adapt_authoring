// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');
  var AssetItemView = require('./assetManagementItemView');

  var AssetCollectionView = OriginView.extend({
    tagName: "div",
    className: "asset-management-collection",

    sort: {
      createdAt: -1
    },
    search: {},
    filters: [],
    tags: [],
    assetLimit: -32,
    assetDenominator: 32,
    collectionLength: 0,
    shouldStopFetches: false,

    preRender: function(options) {
      if(options.search) {
        this.search = options.search;
        var assetType = this.search.assetType;
        if(assetType) this.filters = assetType.$in;
      }
      this.initEventListeners();
    },

    postRender: function() {
      this.setupLazyScrolling();
      // Fake a scroll trigger - just incase the limit is too low and no scroll bars
      $('.asset-management-assets-container').trigger('scroll');
      this.setViewToReady();
    },

    initEventListeners: function() {
      this.listenTo(Origin, {
        'assetManagement:sidebarFilter:add': this.addFilter,
        'assetManagement:sidebarFilter:remove': this.removeFilter,
        'assetManagement:sidebarView:filter': this.filterBySearchInput,
        'assetManagement:assetManagementSidebarView:filterByTags': this.filterByTags,
        'assetManagement:collection:refresh': this.updateCollection
      });
      this.listenTo(this.collection, {
        'add': this.appendAssetItem,
        'sync': this.onCollectionSynced
      });
    },

    appendAssetItem: function (asset) {
      this.$('.asset-management-collection-inner').append(new AssetItemView({ model: asset }).$el);
    },

    setupLazyScrolling: function() {
      var $assetContainer = $('.asset-management-assets-container');
      var $assetContainerInner = $('.asset-management-assets-container-inner');
      // Remove event before attaching
      $assetContainer.off('scroll');
      $assetContainer.on('scroll', _.bind(function() {
        var scrollableHeight = $assetContainerInner.height() - $assetContainer.height();
        var scrollTop = $assetContainer.scrollTop();
        var isAtBottom = (scrollableHeight - scrollTop) < 30;
        if (isAtBottom && !this.isCollectionFetching) {
          this.isCollectionFetching = true;
          this.lazyRenderCollection();
        }
      }, this));
    },

    removeLazyScrolling: function() {
      $('.asset-management-assets-container').off('scroll');
    },

    /**
    * Collection manipulation
    */

    updateCollection: function (reset) {
      if (reset) this.resetCollection();

      if (!Origin.permissions.hasPermissions(["*"])) {
        this.search = _.extend(this.search, { _isDeleted: false });
      }

      this.search = _.extend(this.search, {
        tags: { $all: this.tags },
        assetType: { $in: this.filters }
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
          this.shouldStopFetches = this.collectionLength === this.collection.length;
          this.collectionLength = this.collection.length;
          this.isCollectionFetching = false;
          Origin.trigger('assetManagement:assetManagementCollection:fetched');
        }, this)
      });
    },

    onCollectionSynced: function () {
      $('.asset-management-no-assets').toggleClass('display-none', this.collection.length === 0);
      // FIX: Purely and lovingly put in for a rendering issue with chrome.
      // For when the items being re-rendering after a search return an
      // amount of items that means the container is not scrollable
      if (this.assetLimit >= this.assetDenominator) {
        return;
      }
      $('.asset-management-assets-container').hide();
      _.delay(function() {
          $('.asset-management-assets-container').show();
      }, 10);
    },

    resetCollection: function() {
      // Trigger event to kill zombie views
      Origin.trigger('assetManagement:assetViews:remove');

      this.shouldStopFetches = false;
      this.assetLimit = 0;
      this.collectionLength = 0;
      this.collection.reset();
    },

    lazyRenderCollection: function() {
      // Adjust limit based upon the denominator
      this.assetLimit += this.assetDenominator;
      this.updateCollection(false);
    },

    /**
    * Filtering
    */

    filterCollection: function() {
      this.search.assetType = this.filters.length ? { $in: this.filters } : null;
      this.updateCollection(true);
    },

    addFilter: function(filterType) {
      this.filters.push(filterType);
      this.filterCollection();
    },

    removeFilter: function(filterType) {
      // remove filter from this.filters
      this.filters = _.filter(this.filters, function(item) { return item !== filterType; });
      this.filterCollection();
    },

    filterBySearchInput: function (filterText) {
      var pattern = '.*' + filterText.toLowerCase() + '.*';
      this.search = { title: pattern, description: pattern };
      this.updateCollection(true);

      $(".asset-management-modal-filter-search" ).focus();
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
