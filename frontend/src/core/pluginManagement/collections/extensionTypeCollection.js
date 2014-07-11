define(function(require) {

  var Backbone = require('backbone');
  var ExtensionTypeModel = require('coreJS/pluginManagement/models/extensionTypeModel');

  var ExtensionTypeCollection = Backbone.Collection.extend({

    model: ExtensionTypeModel,

    url: 'api/extensiontype',

    comparator: function(model) {
      return model.get('displayName');
    }

  });

  return ExtensionTypeCollection;

});
