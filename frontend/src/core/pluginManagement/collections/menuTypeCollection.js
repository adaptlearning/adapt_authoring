// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

  var Backbone = require('backbone');
  var MenuTypeModel = require('coreJS/pluginManagement/models/menuTypeModel');

  var MenuTypeCollection = Backbone.Collection.extend({

    model: MenuTypeModel,

    url: function (options) {
      var base = 'api/menutype';
      if (options && options.base) {
        return base;
      }

      return base + '?showall=1';
    },

    comparator: function(model) {
      return model.get('displayName');
    }

  });

  return MenuTypeCollection;

});
