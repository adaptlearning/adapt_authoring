// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var ContentModel = require('./contentModel');

  var MenuTypeModel = ContentModel.extend({
    urlRoot: 'api/menutype',
    idAttribute: '_id',
    _type: 'menu'
  });

  return MenuTypeModel;
});
