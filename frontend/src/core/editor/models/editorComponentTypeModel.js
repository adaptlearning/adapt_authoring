define(function(require) {

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');

  var EditorComponentTypeModel = Backbone.Model.extend({

    idAttribute: '_id',
    urlRoot: '/api/componenttype',
    _parent: 'blocks',
    _siblings:'components',
    _children: null
    
  });

  return EditorComponentTypeModel;

});
