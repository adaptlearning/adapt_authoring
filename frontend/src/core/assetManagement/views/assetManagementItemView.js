define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var OriginView = require('coreJS/app/views/originView');
  var Origin = require('coreJS/app/origin');

  var AssetItemView = OriginView.extend({

    tagName: 'div',

    className: function() {
        return 'asset-management-list-item id-' + this.model.get('_id');
    },

    events: {
        'click' : 'onAssetClicked'
    },

    preRender: function() {
        this.listenTo(Origin, 'assetManagement:assetViews:remove', this.remove);
        this.listenTo(this, 'remove', this.remove);
        this.listenTo(this.model, 'destroy', this.remove);
    },

    postRender: function() {
        // Check if it needs to lazy load the asset image
        if (this.model.get('assetType') === 'image' || this.model.get('assetType') === 'video') {
            this.$el.on('inview', _.bind(this.onInview, this));
        }
    },

    onAssetClicked: function () {
        $('.asset-management-list-item').removeClass('selected');
        this.$el.addClass('selected');
        this.model.set('_isSelected', true);
        Origin.trigger('assetManagement:assetItemView:preview', this.model);
    },

    onInview: function() {
        // Once this asset is inview - change the data-style attribute to the
        // actual style attribute
        var $previewImage = this.$('.asset-management-list-item-image');
        $previewImage.attr('style', $previewImage.attr('data-style'));
        // Remove inview as it's not needed anymore
        this.$el.off('inview');
    }
    
  }, {
    template: 'assetManagementListItem'
  });

  return AssetItemView;

});