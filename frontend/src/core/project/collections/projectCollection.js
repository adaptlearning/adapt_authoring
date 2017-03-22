// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var EditorCourseModel = require('coreJS/editor/course/models/editorCourseModel');

  var ProjectCollection = Backbone.Collection.extend({
    model: EditorCourseModel,
    url: 'api/content/course'
  });

  return ProjectCollection;
});
