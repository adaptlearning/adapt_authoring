// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var ContentModel = require('core/models/contentModel');

  var ComponentTypeModel = ContentModel.extend({
    idAttribute: '_id',
    urlRoot: '/api/componenttype',
    _parent: 'block',

    comparator: function(model) {
      return model.get('displayName');
    }
  });

  return ComponentTypeModel;
});
