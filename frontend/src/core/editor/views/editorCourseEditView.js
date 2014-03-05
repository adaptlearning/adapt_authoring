define(function(require) {

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');

  var EditorCourseEditView = OriginView.extend({
    
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
