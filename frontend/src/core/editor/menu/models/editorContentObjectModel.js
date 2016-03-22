// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

	var EditorModel = require('editorGlobal/models/editorModel');
	var Origin = require('coreJS/app/origin');

	var EditorContentObjectModel = EditorModel.extend({
		
		urlRoot: '/api/content/contentobject',

		_parent: 'contentObjects',

    _siblings:'contentObjects',

    _children: 'articles',

    defaults: {
      _isSelected: false,
      _isExpanded: false
    },

		initialize: function() {
			this.listenTo(this, 'sync', this.setupConstructor);
			this.setupConstructor();
			this.listenTo(this, 'change:_type', this.setupConstructor);
		},

		setupConstructor: function() {
			if (this.get('_parentId') === Origin.editor.data.course.get('_id')) {
				this._parent === 'course';
			}
			if (this.get('_type') === 'menu') {
				this._children = 'contentObjects';
			}
		}
	});

	return EditorContentObjectModel;

});