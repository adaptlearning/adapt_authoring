define(function(require) {

	var EditorModel = require('coreJS/editor/models/editorModel');

	var EditorArticleModel = EditorModel.extend({
		urlRoot: '/api/content/article',
		initialize: function() {}
	}, 
	{
    _parent:'contentObjects',
    _siblings:'articles',
    _children: 'blocks'
	});

	return EditorArticleModel;

});