// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {  
  var EditorModel = require('editorGlobal/models/editorModel');

  var ExtensionModel = EditorModel.extend({
    urlRoot: '/api/extensiontype',
    idAttribute: '_id',
    _type: 'extension',
    _parent: null,
    _siblings: null,
    _children: null,

    initialize: function(){

    }
  });

  return ExtensionModel;
});
