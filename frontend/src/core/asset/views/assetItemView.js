define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var OriginView = require('coreJS/app/views/originView');
  var Origin = require('coreJS/app/origin');

  var AssetItemView = OriginView.extend({

    tagName: 'div',

    className: 'asset-list-item',

    events: {
    },

    preRender: function() {
      this.listenTo(this, 'remove', this.remove);
      this.listenTo(this.model, 'destroy', this.remove);
    }
    
  }, {
    template: 'assetListItem'
  });

  return AssetItemView;

});