// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var ThemeTypeModel = require('core/models/themeTypeModel');

  var ThemeCollection = Backbone.Collection.extend({
    model: ThemeTypeModel,
    url: 'api/themetype',
    comparator: 'displayName'
  });

  return ThemeCollection;
});
