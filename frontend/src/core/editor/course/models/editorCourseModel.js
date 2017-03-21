// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var EditorModel = require('editorGlobal/models/editorModel');

  var EditorCourseModel = EditorModel.extend({
    urlRoot: '/api/content/course',
    _type: 'course',
    _siblings: '',
    _children: 'contentObjects'
  });

  return EditorCourseModel;
});
