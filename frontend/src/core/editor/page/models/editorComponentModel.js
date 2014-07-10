define(function(require) {

    var EditorModel = require('editorGlobal/models/editorModel');

    var EditorComponentModel = EditorModel.extend({
        urlRoot: '/api/content/component',
        initialize: function() {},
        _parent: 'blocks',
        _siblings:'component',
        _children: null
    });

    return EditorComponentModel;

});
