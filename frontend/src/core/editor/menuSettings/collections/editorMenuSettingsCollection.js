// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

  var Backbone = require('backbone');
  var MenuSettingsModel = require('editorMenuSettings/models/editorMenuSettingsModel');

  var MenuSettingsCollection = Backbone.Collection.extend({

    model: MenuSettingsModel,

    url: 'api/menutype'

  });

  return MenuSettingsCollection;

});