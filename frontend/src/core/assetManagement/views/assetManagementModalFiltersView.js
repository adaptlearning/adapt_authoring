define(function(require) {

    var Origin = require('coreJS/app/origin');
    var Backbone = require('backbone');
    var AssetManagementModalTagsView = require('coreJS/assetManagement/views/assetManagementModalTagsView');
    var AssetManagementModalNewAssetView = require('coreJS/assetManagement/views/assetManagementModalNewAssetView');
    var AssetModel = require('coreJS/assetManagement/models/assetModel');

    var AssetManagementModalFiltersView = Backbone.View.extend({

        className: 'asset-management-modal-filters',

        events: {
            'click .asset-management-modal-filter-button': 'onFilterButtonClicked',
            'click .asset-management-modal-filter-clear-search': 'onClearSearchClicked',
            'keyup .asset-management-modal-filter-search': 'onSearchKeyup',
            'click .asset-management-modal-add-tag': 'onAddTagClicked',
            'click .asset-management-modal-add-asset': 'onAddAssetClicked'
        },

        initialize: function(options) {
            this.options = options;
            this.usedTags = [];
            this.tags = [];
            this.availableTags = [];
            this.listenTo(this.collection, 'sync', this.setupTags);
            this.listenTo(Origin, 'modal:closed', this.remove);
            this.listenTo(Origin, 'remove:views', this.remove);
            this.listenTo(Origin, 'assetManagement:modalTags:filterByTags', this.filterAssetsByTags);
            this.render();
        },

        setupTags: function() {
            this.collection.each(function(asset) {
                var tags = asset.get('tags');

                _.each(tags, function(tag) {
                    var titles = _.pluck(this.availableTags, 'title');
                    
                    if (!_.contains(titles, tag.title)) {
                        this.availableTags.push(tag);
                    }
                }, this)
                
            }, this);
        },

        render: function() {
            var data = this.options;
            var template = Handlebars.templates['assetManagementModalFilters'];
            this.$el.html(template(data)).prependTo('.modal-popup-toolbar');
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

        onSearchKeyup: function(event, filter) {
            if (13 == event.keyCode || filter) {
                var filterText = $(event.currentTarget).val();
                Origin.trigger('assetManagement:sidebarView:filter', filterText);
            }
        },

        onClearSearchClicked: function(event) {
            event.preventDefault();
            this.$('.asset-management-modal-filter-search').val('').trigger('keyup', [true]);
        },

        onAddTagClicked: function(event) {
            event.preventDefault();
            $('.modal-popup-toolbar').after(new AssetManagementModalTagsView({title: 'Filter by tags', items: this.availableTags}).$el);
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
            event.preventDefault();
            Origin.trigger('assetManagement:modal:newAssetOpened');
            $('.modal-popup-content').append(new AssetManagementModalNewAssetView({model: new AssetModel()}).$el);
        }

    });

    return AssetManagementModalFiltersView;

});
