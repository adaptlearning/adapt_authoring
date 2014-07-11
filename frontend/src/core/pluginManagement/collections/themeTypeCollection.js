define(function(require) {

  var Backbone = require('backbone');
  var ThemeTypeModel = require('coreJS/pluginManagement/models/themeTypeModel');

  var ThemeTypeCollection = Backbone.Collection.extend({

    model: ThemeTypeModel,

    url: 'api/themetype',

    comparator: function(model) {
      return model.get('displayName');
    }

  });

  return ThemeTypeCollection;

});
