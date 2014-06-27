define(function(require) {
  
  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');

  var ExtensionModel = Backbone.Model.extend({

    idAttribute: '_id',

    urlRoot: '/api/extensiontype'

  });

  return ExtensionModel;

});