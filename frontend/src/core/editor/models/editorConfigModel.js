define(function(require) {

  var Origin = require('coreJS/app/origin');
  var EditorModel = require('coreJS/editor/models/editorModel');

  var EditorConfigModel = EditorModel.extend({
    urlRoot: '/api/content/config',
    
    initialize : function() {}
  },
  {
    _parent: 'course',
    _siblings:'',
    _children: ''
  });

  return EditorConfigModel;

});
