// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');

  var MenuTypeModel = Backbone.Model.extend({
    idAttribute: '_id',
    urlRoot: '/api/menutype'
  });

  return MenuTypeModel;
});
