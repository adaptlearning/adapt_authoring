// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var ContentModel = require('./contentModel');

  var ThemeTypeModel = ContentModel.extend({
    urlRoot: '/api/themetype',
    idAttribute: '_id',
    _type: 'theme'
  });

  return ThemeTypeModel;
});
