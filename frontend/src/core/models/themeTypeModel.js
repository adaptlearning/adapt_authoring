// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('core/origin');

  var ThemeTypeModel = Backbone.Model.extend({
    idAttribute: '_id',
    urlRoot: '/api/themetype'
  });

  return ThemeTypeModel;
});
