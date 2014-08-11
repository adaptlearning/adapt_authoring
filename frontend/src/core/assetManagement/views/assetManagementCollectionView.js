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
            this.filters = [];
            this.collection = new AssetCollection();
            this.listenTo(this.collection, 'sync', this.renderAssetItems);
            this.listenTo(Origin, 'assetManagementSidebar:filter:add', this.addFilter);
            this.listenTo(Origin, 'assetManagementSidebar:filter:remove', this.removeFilter);
        },

        renderAssetItems: function(filteredCollection) {

            var assetCollection = (filteredCollection || this.collection);

            // Check if collection has items and hide instructions
            if (assetCollection.length > 0) {
                $('.asset-management-no-assets').addClass('display-none');
            }

            // Trigger event to kill zombie views
            Origin.trigger('assetManagementCollection:assetViews:remove');
            // Empty collection container
            this.$('.asset-management-collection-inner').empty();

            // Render each asset item
            assetCollection.each(function(asset) {
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
            // Filter collection based upon this.filters array
            var filteredCollection = this.collection.filter(function(assetItem) {

                return _.contains(this.filters, assetItem.get('assetType'));

            }, this);

            // Once filter re-render the view
            // Why re-render is so we can use search on the dom elements whilst keeping
            // the filter separate
            this.renderAssetItems(new Backbone.Collection(filteredCollection));

        }

    }, {
        template: 'assetManagementCollection'
    });

    return AssetCollectionView;

});
