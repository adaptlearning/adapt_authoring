define(function(require) {
  var Backbone = require('backbone');
  var TenantModel = require('../models/tenantModel.js');

  var TenantCollection = Backbone.Collection.extend({
    model: TenantModel,
    url: 'api/tenant'
  });
  return TenantCollection;
});
