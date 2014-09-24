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
        'click' : 'onAssetClicked',
        'inview': 'onInview'
    },

    preRender: function() {
        this.listenTo(Origin, 'assetManagement:assetViews:remove', this.remove);
        this.listenTo(this, 'remove', this.remove);
        this.listenTo(this.model, 'destroy', this.remove);
    },

    onAssetClicked: function () {
        $('.asset-management-list-item').removeClass('selected');
        this.$el.addClass('selected');
        this.model.set('_isSelected', true);
        Origin.trigger('assetManagement:assetItemView:preview', this.model);
    },

    onInview: function() {
      if (this.model.get('assetType') === 'image' || this.model.get('assetType') === 'video') {
        var $previewImage = this.$('.asset-management-list-item-image');
        $previewImage.attr('style', $previewImage.attr('data-style'));
        this.$el.off('inview');
      }
    }
    
  }, {
    template: 'assetManagementListItem'
  });

  return AssetItemView;

});