// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

  var Backbone = require('backbone');
  var AssetModel = require('../models/assetModel');

  var AssetCollection = Backbone.Collection.extend({

    model: AssetModel,

    url: 'api/asset/query',

    dateComparator: function(m) {
      return -m.get('lastUpdated').getTime();
    }

  });

  return AssetCollection;

});
