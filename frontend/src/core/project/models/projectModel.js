define(function(require) {
  
  var Backbone = require('backbone');
  var AdaptBuilder = require('coreJS/app/adaptbuilder');

  var ProjectModel = Backbone.Model.extend({

    idAttribute: '_id',

    urlRoot: '/api/content/course'

  });

  return ProjectModel;

});