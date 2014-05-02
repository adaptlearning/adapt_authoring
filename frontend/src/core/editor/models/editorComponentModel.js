define(function(require) {

    var EditorModel = require('coreJS/editor/models/editorModel');

    var EditorComponentModel = EditorModel.extend({
        urlRoot: '/api/content/component',
        initialize: function() {},
        _parent: 'blocks',
        _siblings:'components',
        _children: null
    });

    return EditorComponentModel;

});
