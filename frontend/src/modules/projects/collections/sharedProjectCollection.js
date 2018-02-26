// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var CourseModel = require('core/models/courseModel');

  var SharedProjectCollection = Backbone.Collection.extend({
    model: CourseModel,
    url: 'api/shared/course'
  });

  return SharedProjectCollection;
});
