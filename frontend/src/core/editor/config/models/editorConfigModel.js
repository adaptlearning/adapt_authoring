define(function(require) {
  var EditorModel = require('editorGlobal/models/editorModel');
  var EditorConfigModel = EditorModel.extend({

    url: function() {
        return '/api/content/config/' + this.get('_courseId');   
    },

    _siblings: '',
    _children: '',
    _parent: 'course',
    _type: 'config'
  });

  return EditorConfigModel;
});