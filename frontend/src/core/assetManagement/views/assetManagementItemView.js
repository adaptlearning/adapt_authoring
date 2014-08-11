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

    onAssetClicked: function () {
        $('.asset-management-list-item').removeClass('selected');
        this.$el.addClass('selected');
        this.model.set('_isSelected', true);
        Origin.trigger('assetManagement:assetItemView:preview', this.model);
    }
    
  }, {
    template: 'assetManagementListItem'
  });

  return AssetItemView;

});