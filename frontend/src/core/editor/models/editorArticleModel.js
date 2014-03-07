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

// <<<<<<< HEAD
	return EditorArticleModel;

})
/*
=======
      urlRoot: '/api/content/article',

      initialize: function(options) {
        // TODO -- plug this in
        // this.set('articleCount', 4);
      }
    });

    return PageArticleModel;

});
>>>>>>> block_crud
*/