define(function(require) {

    var EditorModel = require('coreJS/editor/models/editorModel');

    var EditorClipboardModel = EditorModel.extend({
        urlRoot: '/api/content/clipboard',
    });

    return EditorClipboardModel;

});
