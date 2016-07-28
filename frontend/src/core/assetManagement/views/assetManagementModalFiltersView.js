// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

    var Origin = require('coreJS/app/origin');
    var Backbone = require('backbone');
    var AssetManagementModalTagsView = require('coreJS/assetManagement/views/assetManagementModalTagsView');
    var AssetManagementModalNewAssetView = require('coreJS/assetManagement/views/assetManagementModalNewAssetView');
    var AssetModel = require('coreJS/assetManagement/models/assetModel');
    var TagsCollection = require('coreJS/tags/collections/tagsCollection');

    var AssetManagementModalFiltersView = Backbone.View.extend({

        className: 'asset-management-modal-filters',

        events: {
            'click .asset-management-modal-filter-button': 'onFilterButtonClicked',
            'click .asset-management-modal-filter-clear-search': 'onClearSearchClicked',
            'keyup .asset-management-modal-filter-search': 'onSearchKeyDown',
            'click .asset-management-modal-add-tag': 'onAddTagClicked',
            'click .asset-management-modal-add-asset': 'onAddAssetClicked'
        },

        initialize: function(options) {
            this.options = options;
            this.usedTags = [];
            this.tags = [];
            this.availableTags = [];
            this.tagsCollection = new TagsCollection();
            this.listenTo(this.tagsCollection, 'sync', this.setupTags);
            this.tagsCollection.fetch({reset: true});
            this.listenTo(Origin, 'modal:closed', this.remove);
            this.listenTo(Origin, 'remove:views', this.remove);
            this.listenTo(Origin, 'assetManagement:modalTags:filterByTags', this.filterAssetsByTags);
            this.render();

            // used to delay filter
            this.filterDelay = null;
        },

        setupTags: function() {
            this.tagsCollection.each(function(tag) {
                this.availableTags.push(tag.toJSON());
            }, this);
        },

        render: function() {
            var data = this.options;
            var template = Handlebars.templates['assetManagementModalFilters'];
            var $popupToolbar = $('.modal-popup-toolbar');
            if (this.options.modalView) {
                $popupToolbar = this.options.modalView.$el.find('.modal-popup-toolbar');
            }
            this.$el.html(template(data)).prependTo($popupToolbar);
            _.defer(_.bind(this.postRender, this));

            return this;
        },

        postRender: function() {},

        onFilterButtonClicked: function(event) {
            $currentTarget = $(event.currentTarget);
            var filterType = $currentTarget.attr('data-filter-type');

            // If this filter is already selected - remove filter
            // else add the filter
            if ($currentTarget.hasClass('selected')) {
                $currentTarget.removeClass('selected');
                Origin.trigger('assetManagement:sidebarFilter:remove', filterType);
            } else {
                $currentTarget.addClass('selected');
                Origin.trigger('assetManagement:sidebarFilter:add', filterType);
            }

        },

        onSearchKeyDown: function(event, filter) {
          switch(event.which) {
            case 16: // shift
            case 18: // alt
              return;
            default:
              window.clearTimeout(this.filterDelay);
              this.filterDelay = window.setTimeout(function() {
                var filterText = $(event.currentTarget).val();
                Origin.trigger('assetManagement:sidebarView:filter', filterText);
              }, 500);
              break;
          }
        },

        onClearSearchClicked: function(event) {
            event && event.preventDefault();
            this.$('.asset-management-modal-filter-search').val('').trigger('keydown', [true]);
        },

        onAddTagClicked: function(event) {
            event && event.preventDefault();
            var exists = $('.asset-management-modal-tags').length > 0;
            if(!exists) {
              $('.modal-popup-toolbar').after(new AssetManagementModalTagsView({title: 'Filter by tags', items: this.availableTags}).$el);
            }
        },

        filterAssetsByTags: function(tag) {

            if (_.findWhere(this.usedTags, {id: tag.id})) {
                this.usedTags = _.reject(this.usedTags, function(tagItem) {
                    return tagItem.id === tag.id;
                });
                var availableTag = _.findWhere(this.availableTags, {_id: tag.id});
                availableTag._isUsed = false;

            } else {
                this.usedTags.push(tag);
                var availableTag = _.findWhere(this.availableTags, {_id: tag.id});
                availableTag._isUsed = true;
            }

            Origin.trigger('assetManagement:assetManagementSidebarView:filterByTags', this.usedTags);

        },

        onAddAssetClicked: function(event) {
            event && event.preventDefault();
            Origin.trigger('assetManagement:modal:newAssetOpened');
            $('.modal-popup-content').append(new AssetManagementModalNewAssetView({model: new AssetModel()}).$el);
        }

    });

    return AssetManagementModalFiltersView;

});
