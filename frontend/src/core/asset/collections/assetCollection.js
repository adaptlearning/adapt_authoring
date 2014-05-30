define(function(require) {

  var Backbone = require('backbone');
  var AssetModel = require('coreJS/asset/models/assetModel');

  var AssetCollection = Backbone.Collection.extend({

    model: AssetModel,

    url: 'api/asset',

    dateComparator: function(m) {
      return -m.get('lastUpdated').getTime();
    }

  });

  return AssetCollection;

});