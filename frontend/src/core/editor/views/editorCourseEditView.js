define(function(require) {

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('coreJS/editor/views/editorOriginView');

  var EditorCourseEditView = EditorOriginView.extend({
    
    tagName: "div",

    className: "editor-course-edit",

    preRender: function() {
      this.listenTo(Origin, 'editor:removeSubViews', this.remove);
    }
  
  },
  {
    template: 'editorCourseEdit'
  });

  return EditorCourseEditView;

});
