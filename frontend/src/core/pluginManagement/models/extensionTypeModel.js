// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');

  var ExtensionTypeModel = Backbone.Model.extend({

    idAttribute: '_id',

    urlRoot: '/api/extensiontype'

  });

  return ExtensionTypeModel;

});
