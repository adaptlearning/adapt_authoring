// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){

  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');
  var AssetManagementCollectionView = require('coreJS/assetManagement/views/assetManagementCollectionView');
  var AssetManagementPreviewView = require('coreJS/assetManagement/views/assetManagementPreviewView');

  var AssetPickerView = OriginView.extend({

    tagName: "div",

    className: "asset-management-collection",

    events: {
        'click .asset-picker-sidebar-new': 'onAddNewAssetClicked',
        'click .asset-picker-sidebar-filter-button': 'onFilterButtonClicked',
        'click .asset-picker-sidebar-filter-clear-search': 'onClearSearchClicked',
        'keyup .asset-management-sidebar-filter-search': 'onSearchKeyup'
    },

    onAddNewAssetClicked: function() {
        Origin.router.navigate('#/assetManagement/new', {trigger: true});
    },

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
        this.$('.asset-management-sidebar-filter-search').val('').trigger('keyup', [true]);
    },

    preRender: function() {
        this.listenTo(Origin, 'assetManagement:assetItemView:preview', this.onAssetClicked);
        this.listenTo(Origin, 'window:resize', this.resizeAssetPanels);
    },

    resizeAssetPanels: function() {
        var navigationHeight = $('.navigation').outerHeight();
        var locationTitleHeight = $('.location-title').outerHeight();
        var windowHeight = $(window).height();
        var actualHeight = windowHeight - (navigationHeight + locationTitleHeight);
        this.$('.asset-management-assets-container').height(actualHeight);
        this.$('.asset-management-preview-container').height(actualHeight);
    },

    onAssetClicked: function(model) {
        model.set('isSelectable', true);
        this.$('.asset-management-no-preview').hide();
        this.$('.asset-management-preview-container-inner').html(new AssetManagementPreviewView({
            model: model
        }).$el);
    },

    postRender: function() {
        $('.asset-management-assets-container-inner').append(new AssetManagementCollectionView({attributes: {isSelectMode: true, selectedAsset: this.attributes['_selectedAsset']}}).$el);
        this.resizeAssetPanels();
    }

  }, {
    template: 'assetPicker'
  });

  return AssetPickerView;
});