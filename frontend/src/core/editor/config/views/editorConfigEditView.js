define(function(require) {

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('editorGlobal/views/editorOriginView');

  var EditorConfigEditView = EditorOriginView.extend({
    
    tagName: "div",

    className: "editor-config-edit",

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
        _defaultLanguage: this.$('.config-defaultLanguage').val(),
        _questionWeight: this.$('.config-questionWeight').val()
      },
      {
        error: function() {
          alert('An error occurred doing the save');
        },
        success: function() {
          Origin.trigger('editorView:fetchData');
        }
      });
    }
  
  },
  {
    template: 'editorConfigEdit'
  });

  return EditorConfigEditView;

});
