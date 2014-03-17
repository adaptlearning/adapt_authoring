define(function(require) {

	var EditorModel = require('coreJS/editor/models/editorModel');
	var Origin = require('coreJS/app/origin');

	var EditorContentObjectModel = EditorModel.extend({
		
		urlRoot: '/api/content/contentobject',

		_parent: 'contentObjects',

    	_siblings:'contentObjects',

        _children: 'articles',

		initialize: function() {
			this.listenTo(this, 'sync', this.setupConstructor);
			this.setupConstructor();
			this.listenTo(this, 'change:_type', this.setChildrenType);
		},

		setupConstructor: function() {
			//console.log('setting up constructor');
			if (this.get('_parentId') === Origin.editor.data.course.get('_id')) {
				this._parent === 'course';
			}
			this.setChildrenType();
		},

		setChildrenType: function() {
			console.log('my type', this.get('_type'));
			if (this.get('_type') === 'menu') {
				console.log('setChildrenType', this);
				this._children = 'contentObjects';
				console.log('my contentObject _children', this._children);
			}
		}
	});

	return EditorContentObjectModel;

});