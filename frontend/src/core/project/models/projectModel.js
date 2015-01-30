define(function(require) {
  
  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');

  var ProjectModel = Backbone.Model.extend({

    idAttribute: '_id',

    urlRoot: '/api/content/course',

    defaults: {
        'tags': [],
        _type: 'course'
    },
    
    isShared: function () {
      return this.get('_isShared');
    },
    
    getDuplicateURI: function () {
      return '/api/duplicatecourse/' + this.get('_id');
    }

  });

  return ProjectModel;

});