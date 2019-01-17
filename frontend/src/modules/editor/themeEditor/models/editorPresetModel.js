// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var EditorModel = require('./editorModel');

  var EditorPresetModel = EditorModel.extend({
    urlRoot: '/api/content/themepreset',
  });

  return EditorPresetModel;
});
