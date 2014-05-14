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
			this.listenTo(this, 'change:_type', this.setupConstructor);
			this.listenTo(this, 'change:_isSelected', function() {
				console.log(this.get('title'), this.get('_isSelected'));
			})
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