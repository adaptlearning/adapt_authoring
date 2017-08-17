// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var ConfigModel = require('core/models/configModel');

  var ConfigCollection = Backbone.Collection.extend({
    model: ConfigModel,
    url: 'api/content/config'
  });

  return ConfigCollection;
});
