define(function(require) {

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');

  var EditorCourseEditView = OriginView.extend({
    
    tagName: "div",

    className: "editor-course-edit"
  
  },
  {
    template: 'editorCourseEdit'
  });

  return EditorCourseEditView;

});
