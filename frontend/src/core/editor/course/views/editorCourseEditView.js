// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('editorGlobal/views/editorOriginView');

  var EditorCourseEditView = EditorOriginView.extend({
    
    tagName: "div",

    className: "project",

    events: {
      'click .save-button'   : 'saveData',
      'click .cancel-button' : 'cancel'
    },

    preRender: function() {
      this.listenTo(Origin, 'editorSidebarView:removeEditView', this.remove);
    },

    cancel: function(event) {
      event.preventDefault();
      Origin.trigger('editorSidebarView:removeEditView', this.model);
    },

    saveData: function(event) {
      event.preventDefault();

      var model = this.model;

      model.save({
        title: this.$('.course-title').val(),
        body: this.$('.course-body').val(),
        submit: this.$('.course-submit').val(),
        reset: this.$('.course-reset').val(), 
        showCorrectAnswer: this.$('.course-show-correct').val(),
        hideCorrectAnswer: this.$('.course-hide-correct').val()
      },
      {
        error: function() {
          alert('An error occurred doing the save');
        },
        success: function() {
          Origin.trigger('editor:refreshData', function() {
            Backbone.history.history.back();
            this.remove();
          }, this);
        }
      });
    }
  
  },
  {
    template: 'editorCourseEdit'
  });

  return EditorCourseEditView;

});
