define(function(require) {

  var Backbone = require('backbone');
  var ConfigModel = require('editorConfig/models/editorConfigModel');

  var ConfigCollection = Backbone.Collection.extend({

    model: ConfigModel,

    url: 'api/content/config'

  });

  return ConfigCollection;

});