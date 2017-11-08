// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

  var Backbone = require('backbone');
  var ProjectModel = require('core/models/courseModel');

  var TenantProjectCollection = Backbone.Collection.extend({

    model: ProjectModel,

    url: 'api/my-tenant/course'

  });

  return TenantProjectCollection;

});