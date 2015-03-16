// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

  var Backbone = require('backbone');
  var ThemeModel = require('editorTheme/models/editorThemeModel');

  var ThemeCollection = Backbone.Collection.extend({

    model: ThemeModel,

    url: 'api/themetype',

    comparator: 'displayName'

  });

  return ThemeCollection;

});