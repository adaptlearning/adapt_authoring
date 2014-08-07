define(function(require) {

  var Backbone = require('backbone');
  var ThemeModel = require('editorTheme/models/editorThemeModel');

  var ThemeCollection = Backbone.Collection.extend({

    model: ThemeModel,

    url: 'api/themetype'

  });

  return ThemeCollection;

});