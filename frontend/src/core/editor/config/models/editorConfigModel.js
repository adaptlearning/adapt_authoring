define(function(require) {
  var EditorModel = require('editorGlobal/models/editorModel');
  var EditorConfigModel = EditorModel.extend({

    urlRoot: '/api/content/config',

    _siblings: '',
    _children: '',
    _parent: 'course',
    _type: 'config'

  });

  return EditorConfigModel;
});
