// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var _ = require('underscore');
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
    assetPageSize: 1,

    initialize: function(options) {
      OriginView.prototype.initialize.apply(this, arguments);
      this.isModal = options.isModal;
    },

    addListeners: function() {
      this.listenTo(Origin, 'assetManagement:sidebarFilter:add', this.addFilter);
      this.listenTo(Origin, 'assetManagement:sidebarFilter:remove', this.removeFilter);
      this.listenTo(Origin, 'assetManagement:sidebarView:filter', this.filterBySearchInput);
      this.listenTo(Origin, 'assetManagement:assetManagementSidebarView:filterByTags', this.filterByTags);
      this.listenTo(Origin, 'assetManagement:collection:refresh', this.updateCollection);

      this.listenTo(Origin, 'assets:update', this.onAssetUpdated);

      this.listenTo(this.collection, 'add', this.appendAssetItem);
      this.listenTo(this.collection, 'sync', this.onCollectionSynced);

      $('.asset-management-message').click(_.bind(this.clickMessage, this));
    },

    setDefaults: function(options) {
      this.sort = { title: 1 };
      this.search = (options.search || {});
      // TODO is this likely?
      this.filters = (this.search.assetType) ? options.search.assetType.$in : [];
      this.tags = [];

      this.collectionLength = 0;

      this.shouldStopFetches = false;
    },

    setPageSize: function(options) {
      // work out how many assets we can fit from the size of the only rendered asset
      var $el = this.$('.asset-management-list-item').first();
      var $container = $('.asset-management');
      // always round down, as tiles will be pushed to next row
      var horizontalItems = Math.floor($container.width()/$el.outerWidth(true));
      // always round up, as rows could be half onscreen
      var verticalItems = Math.ceil($container.height()/$el.outerHeight(true));
      this.assetPageSize = horizontalItems*verticalItems;
      // Set to minus so we can have more DRY code
      this.assetLimit = this.assetPageSize*-1;
      this.assetDenominator = this.assetPageSize;
    },

    preRender: function(options) {
      this.setDefaults(options);
      this.addListeners();
    },

    postRender: function() {
      this.setupLazyScrolling();
      this.setViewToReady();
    },

    resetView: function() {
      this.shouldStopFetches = false;
      this.assetLimit = 0;
      this.collectionLength = 0;
      this.collection.reset();
    },

    setupLazyScrolling: function() {
      this.removeLazyScrolling();
      $('.asset-management-assets-container').on('scroll', _.bind(this.onContainerScroll, this));

      this.updateCollection(true);
    },

    removeLazyScrolling: function() {
      $('.asset-management-assets-container').off('scroll');
    },

    lazyRenderCollection: function() {
      // Adjust limit based upon the denominator
      this.assetLimit += this.assetDenominator;
      this.updateCollection(false);
    },

    appendAssetItem: function(asset) {
      asset.set('isModal', this.isModal);
      this.$('.asset-management-collection-inner').append(new AssetItemView({ model: asset }).$el);
    },

    addFilter: function(filterType) {
      // add filter to this.filters
      this.filters.push(filterType);
      this.filterCollection();
    },

    removeFilter: function(filterType) {
      // remove filter from this.filters
      this.filters = _.filter(this.filters, function(item) { return item != filterType; });
      this.filterCollection();
    },

    filterCollection: function() {
      this.search.assetType = this.filters.length ? { $in: this.filters } : null;
      this.updateCollection(true);
    },

    filterBySearchInput: function(filterText) {
      var pattern = '.*' + filterText.toLowerCase() + '.*';
      this.search = { title: pattern, description: pattern };
      this.updateCollection(true);
      $(".asset-management-modal-filter-search" ).focus();
    },

    filterByTags: function(tags) {
      this.tags = _.pluck(tags, 'id');
      this.updateCollection(true);
    },

    updateCollection: function(reset) {
      if (reset) {
        Origin.trigger('assetManagement:assetViews:remove');
        this.resetView();
      }
      // only show _isDeleted if you're admin... TODO make this more specific
      if (!Origin.permissions.hasPermissions(["*"])) {
        this.search = _.extend(this.search, { _isDeleted: false });
      }
      this.search = _.extend(this.search, {
        tags: { $all: this.tags },
        assetType: { $in: this.filters }
      });
      // set when the fetched amount is equal to the collection length
      if (this.shouldStopFetches) {
        return;
      }
      this.isCollectionFetching = true;

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
        success: _.bind(this.onCollectionFetched, this)
      });
    },

    onAssetUpdated: function(data) {
      this.search = { _id: { $eq: data._id } };
      this.updateCollection(true);
      // TODO localise
      this.showMessage('Only showing uploaded asset. Click to show all.');

      Origin.once('assetManagement:message:close', _.bind(function() {
        this.search = {};
        this.updateCollection(true);
      }, this));
    },

    clickMessage: function() {
      Origin.trigger('assetManagement:message:close');
      this.hideMessage();
    },
    showMessage: function(msg) {
      $('.asset-management-message').text(msg).show();
    },
    hideMessage: function() {
      $('.asset-management-message').hide();
    },

    onCollectionSynced: function() {
      if (this.collection.length === 0) {
        $('.asset-management-no-assets').removeClass('display-none');
      } else {
        $('.asset-management-no-assets').addClass('display-none');
      }
      // HACK for chrome: makes sure the view is scrollable
      if (this.assetLimit < this.assetDenominator) {
        $('.asset-management-assets-container').hide();
        _.delay(function() { $('.asset-management-assets-container').show(); }, 10);
      }
    },

    onCollectionFetched: function() {
      if(this.assetPageSize === 1) {
        return this.setPageSize();
      }
      // On successful collection fetching set lazy render to enabled
      if (this.collectionLength === this.collection.length) {
        this.shouldStopFetches = true;
      } else {
        this.shouldStopFetches = false;
        this.collectionLength = this.collection.length;
      }
      this.isCollectionFetching = false;
      Origin.trigger('assetManagement:assetManagementCollection:fetched', this.collection);
    },

    onContainerScroll: function() {
      var $assetContainer = $('.asset-management-assets-container');
      var $assetContainerInner = $('.asset-management-assets-container-inner');
      var scrollTop = $assetContainer.scrollTop();
      var scrollableHeight = $assetContainerInner.height();
      var containerHeight = $assetContainer.height();
      // If the scroll position of the assets container is
      // near the bottom
      var isAtBottom = (scrollableHeight-containerHeight) - scrollTop < 30;
      if (isAtBottom && !this.isCollectionFetching) {
        this.lazyRenderCollection();
      }
    }
  }, {
    template: 'assetManagementCollection'
  });

  return AssetCollectionView;
});
