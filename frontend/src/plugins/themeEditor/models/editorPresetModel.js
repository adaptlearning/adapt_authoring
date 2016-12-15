// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
	var EditorModel = require('editorGlobal/models/editorModel');

	var EditorPresetModel = EditorModel.extend({
		urlRoot: '/api/content/themepreset',
	});
	
	return EditorPresetModel;
});
