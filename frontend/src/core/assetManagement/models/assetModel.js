define(function(require) {
  
  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');

  var AssetModel = Backbone.Model.extend({

    idAttribute: '_id',

    urlRoot: '/api/asset'

  });

  return AssetModel;

});