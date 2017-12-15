// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');
  var AssetItemView = require('./assetManagementItemView');

  var AssetCollectionView = OriginView.extend({
    className: "asset-management-collection",

    sort: { createdAt: -1 },
    search: {},
    filters: [],
    tags: [],
    fetchCount: 0,
    shouldStopFetches: false,
    pageSize: 1,

    preRender: function(options) {
      if(options.search) {
        this.search = options.search;
        var assetType = this.search.assetType;
        if(assetType) this.filters = assetType.$in;
      }
      this.initEventListeners();

      this._doLazyScroll = _.bind(_.throttle(this.doLazyScroll, 250), this);
      this._onResize = _.bind(_.debounce(this.onResize, 400), this);
    },

    postRender: function() {
      this.initPaging();
      // init lazy scrolling
      $('.asset-management-assets-container').on('scroll', this._doLazyScroll);
      $(window).on('resize', this._onResize);
    },

    initEventListeners: function() {
      this.listenTo(Origin, {
        'assetManagement:sidebarFilter:add': this.addFilter,
        'assetManagement:sidebarFilter:remove': this.removeFilter,
        'assetManagement:sidebarView:filter': this.filterBySearchInput,
        'assetManagement:assetManagementSidebarView:filterByTags': this.filterByTags,
        'assetManagement:collection:refresh': this.resetCollection
      });
      this.listenTo(this.collection, 'add', this.appendAssetItem);
    },

    initPaging: function() {
      this.resetCollection(_.bind(function(collection) {
        var containerHeight = $('.asset-management-assets-container').outerHeight();
        var containerWidth = $('.asset-management-assets-container').outerWidth();
        var itemHeight = $('.asset-management-list-item').outerHeight(true);
        var itemWidth = $('.asset-management-list-item').outerWidth(true);
        var columns = Math.floor(containerWidth/itemWidth);
        var rows = Math.floor(containerHeight/itemHeight);
        // columns stack nicely, but need to add extra row if it's not a clean split
        if((containerHeight % itemHeight) > 0) rows++;
        this.pageSize = columns*rows;

        // need another reset to get the actual pageSize number of items
        this.resetCollection(this.setViewToReady);
      }, this));
    },

    appendAssetItem: function (asset) {
      this.$('.asset-management-collection-inner').append(new AssetItemView({ model: asset }).$el);
    },

    /**
    * Collection manipulation
    */

    fetchCollection: function(cb) {
      if(this.shouldStopFetches || this.isCollectionFetching) {
        return;
      }
      this.isCollectionFetching = true;

      this.collection.fetch({
        data: {
          search: _.extend(this.search, {
            tags: { $all: this.tags },
            assetType: { $in: this.filters }
          }),
          operators : {
            skip: this.fetchCount,
            limit: this.pageSize,
            sort: this.sort
          }
        },
        success: _.bind(function(collection, response) {
          this.isCollectionFetching = false;
          this.fetchCount += response.length;
          // stop further fetching if this is the last page
          if(response.length < this.pageSize) this.shouldStopFetches = true;

          $('.asset-management-no-assets').toggleClass('display-none', this.fetchCount > 0);

          Origin.trigger('assetManagement:assetManagementCollection:fetched');
          if(typeof cb === 'function') cb(collection);
        }, this),
        error: function(error) {
          console.log(error);
          this.isCollectionFetching = false;
        }
      });
    },

    resetCollection: function(cb, shouldFetch) {
      // to remove old views
      Origin.trigger('assetManagement:assetViews:remove');

      this.shouldStopFetches = false;
      this.fetchCount = 0;
      this.collection.reset();

      if (shouldFetch === undefined || shouldFetch === true) {
        this.fetchCollection(cb);
      }
    },

    /**
    * Filtering
    */

    filterCollection: function() {
      this.resetCollection(null, false);
      this.search.assetType = this.filters.length ? { $in: this.filters } : null;
      this.fetchCollection();
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
      this.resetCollection(null, false);
      var pattern = '.*' + filterText.toLowerCase() + '.*';
      this.search = { title: pattern, description: pattern };
      this.fetchCollection();

      $(".asset-management-modal-filter-search" ).focus();
    },

    filterByTags: function(tags) {
      this.resetCollection(null, false);
      this.tags = _.pluck(tags, 'id');
      this.fetchCollection();
    },

    /**
    * Event handling
    */

    onResize: function() {
      this.initPaging();
    },

    doLazyScroll: function(e) {
      if(this.isCollectionFetching) {
        return;
      }
      var $el = $(e.currentTarget);
      var scrollableHeight = this.$el.height() - this.$el.height();
      var pxRemaining = this.$el.height() - ($el.scrollTop() + $el.height());
      var scrollTriggerAmmount = $('.asset-management-list-item').first().outerHeight()/2;
      // we're at the bottom, fetch more
      if (pxRemaining <= scrollTriggerAmmount) this.fetchCollection();
    },

    remove: function() {
      $('.asset-management-assets-container').off('scroll', this._doLazyScroll);
      $(window).on('resize', this._onResize);

      OriginView.prototype.remove.apply(this, arguments);
    }

  }, {
    template: 'assetManagementCollection'
  });
  return AssetCollectionView;
});
