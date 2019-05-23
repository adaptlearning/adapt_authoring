// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');

  var AssetModel = Backbone.Model.extend({
    idAttribute: '_id',
    urlRoot: 'api/asset'
  });

  return AssetModel;
});
