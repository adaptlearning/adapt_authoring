define(function(require) {

    var EditorModel = require('editorGlobal/models/editorModel');

    var EditorClipboardModel = EditorModel.extend({
        urlRoot: '/api/content/clipboard',
    });

    return EditorClipboardModel;

});
