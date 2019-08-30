// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var PresetModel = require('../models/editorPresetModel.js');

  var PresetCollection = Backbone.Collection.extend({
    url: 'api/content/themepreset',
    comparator: 'parentTheme',
    model: PresetModel
  });

  return PresetCollection;
});
