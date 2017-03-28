// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');

  var MenuSettingsCollection = Backbone.Collection.extend({
    model: Backbone.Model,
    url: 'api/menutype'
  });

  return MenuSettingsCollection;
});
