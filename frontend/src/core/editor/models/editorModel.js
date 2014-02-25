define(function(require) {
  
  var Backbone = require('backbone');
  var AdaptBuilder = require('coreJS/app/adaptbuilder');

  var EditorModel = Backbone.Model.extend({

    idAttribute: '_id',

    urlRoot: '/api/content/course'

  });

  return EditorModel;

});