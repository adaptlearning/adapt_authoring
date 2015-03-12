// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

    var EditorModel = require('editorGlobal/models/editorModel');

    var EditorClipboardModel = EditorModel.extend({
        urlRoot: '/api/content/clipboard',
    });

    return EditorClipboardModel;

});
