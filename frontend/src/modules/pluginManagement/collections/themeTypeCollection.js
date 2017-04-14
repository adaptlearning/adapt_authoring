// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var ThemeTypeModel = require('../models/themeTypeModel');

  var ThemeTypeCollection = Backbone.Collection.extend({
    model: ThemeTypeModel,

    url: function (options) {
      var base = 'api/themetype';
      if (options && options.base) {
        return base;
      }
      return base + '?showall=1';
    },

    comparator: function(model) {
      return model.get('displayName');
    }
  });

  return ThemeTypeCollection;
});
