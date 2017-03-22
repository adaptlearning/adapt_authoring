// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var EditorModel = require('../../global/models/editorModel');

  var EditorComponentTypeModel = EditorModel.extend({
    idAttribute: '_id',
    urlRoot: '/api/componenttype',
    _parent: 'blocks',
    _siblings:'componenttypes',
    _children: null,

    initialize: function() {
      // TODO intentional override?
    }
  });

  return EditorComponentTypeModel;
});
