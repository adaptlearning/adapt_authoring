define(function(require) {

  var Backbone = require('backbone');
  var AdaptBuilder = require('coreJS/app/adaptbuilder');
  var BuilderView = require('coreJS/app/views/builderView');

  var EditorCourseEditView = BuilderView.extend({
    
    tagName: "div",

    className: "editor-course-edit"
  
  },
  {
    template: 'editorCourseEdit'
  });

  return EditorCourseEditView;

});
