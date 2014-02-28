define(function(require) {
  
  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');

  var ProjectModel = Backbone.Model.extend({

    idAttribute: '_id',

    urlRoot: '/api/content/course'

  });

  return ProjectModel;

});