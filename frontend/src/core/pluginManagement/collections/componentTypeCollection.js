define(function(require) {

  var Backbone = require('backbone');
  var ComponentTypeModel = require('coreJS/pluginManagement/models/componentTypeModel');

  var ComponentTypeCollection = Backbone.Collection.extend({

    model: ComponentTypeModel,

    url: 'api/componenttype',

    comparator: function(model) {
      return model.get('displayName');
    }

  });

  return ComponentTypeCollection;

});
