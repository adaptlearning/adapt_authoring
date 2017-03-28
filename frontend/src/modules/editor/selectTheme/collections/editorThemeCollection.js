// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');

  var ThemeCollection = Backbone.Collection.extend({
    model: Backbone.Model,
    url: 'api/themetype',
    comparator: 'displayName'
  });

  return ThemeCollection;
});
