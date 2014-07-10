define(function(require) {
  
  var EditorModel = require('editorGlobal/models/editorModel');

  var ExtensionModel = EditorModel.extend({

    idAttribute: '_id',

    urlRoot: '/api/extensiontype',
    _parent: null,
    _siblings: null,
    _children: null,
    _type: 'extension'

  });

  return ExtensionModel;

});