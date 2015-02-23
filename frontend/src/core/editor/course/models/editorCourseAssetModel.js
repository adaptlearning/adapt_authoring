define(function(require) {
  
  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');

  var CourseAssetModel = Backbone.Model.extend({

    idAttribute: '_id',

    urlRoot: '/api/content/courseasset'

  });

  return CourseAssetModel;

});
