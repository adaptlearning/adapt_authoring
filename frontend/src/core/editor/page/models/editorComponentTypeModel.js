// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

 var EditorModel = require('editorGlobal/models/editorModel');

  var EditorComponentTypeModel = EditorModel.extend({

    initialize: function() {},
    idAttribute: '_id',
    urlRoot: '/api/componenttype',
    _parent: 'blocks',
    _siblings:'componenttypes',
    _children: null
  });

  return EditorComponentTypeModel;

});