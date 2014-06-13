define(function(require) {

  var EditorModel = require('editorGlobal/models/editorModel');

	var EditorCourseModel = EditorModel.extend({

		urlRoot: '/api/content/course',

		_siblings:'',

    _children: 'contentObjects'
        
	});

  return EditorCourseModel;

});