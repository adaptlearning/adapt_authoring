define(function(require) {

	var EditorModel = require('coreJS/editor/models/editorModel');

	var EditorCourseModel = EditorModel.extend({
		urlRoot: '/api/content/course'
	}, 
	{
        _parent: 'course',
    	_siblings:'',
        _children: 'contentObjects'
	});

	return EditorCourseModel;

});