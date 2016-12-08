// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

    var EditorModel = require('editorGlobal/models/editorModel');

    var EditorComponentModel = EditorModel.extend({
        urlRoot: '/api/content/component',
        initialize: function() {},

        _parent: 'blocks',
        _siblings:'components',
        _children: false,
        // These are the only attributes which should be permitted on a save
        whitelistAttributes: ['_id', '_componentType', '_courseId', '_layout', '_parentId', 
            '_type', 'properties', '_component', '_extensions', '_classes', '_isOptional', '_isAvailable', 'body', 'displayTitle', 
            'title', 'version']
    });

    return EditorComponentModel;

});
