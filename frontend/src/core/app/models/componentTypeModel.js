// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var ContentModel = require('core/app/models/contentModel');

  var ComponentTypeModel = ContentModel.extend({
    idAttribute: '_id',
    urlRoot: '/api/componenttype',
    _parent: 'blocks',

    comparator: function(model) {
      return model.get('displayName');
    },

    initialize: function() {
      // TODO intentional override?
    }
  });

  return ComponentTypeModel;
});
