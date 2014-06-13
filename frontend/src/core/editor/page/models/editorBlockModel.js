define(function(require) {

	var EditorModel = require('editorGlobal/models/editorModel');

	var EditorBlockModel = EditorModel.extend({

		urlRoot: '/api/content/block',

		initialize: function() {},

		_parent: 'articles',

    	_siblings:'blocks',

        _children: 'components'

	});

	return EditorBlockModel;

});
