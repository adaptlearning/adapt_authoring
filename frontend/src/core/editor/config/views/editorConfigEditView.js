// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('editorGlobal/views/editorOriginView');

  var EditorConfigEditView = EditorOriginView.extend({
    
    tagName: "div",

    className: "config-edit",

    preRender: function() {
      this.listenTo(Origin, 'editorSidebarView:removeEditView', this.remove);
      this.listenTo(Origin, 'editorConfigEditSidebar:views:save', this.saveData);
    },

    saveData: function(event) {
      var errors = this.form.commit();
      // This must trigger no matter what, as sidebar needs to know 
      // when the form has been resubmitted
      Origin.trigger('editorSidebar:showErrors', errors);
      if (errors) {
        return;
      }

      this.model.save(null, {
        error: function() {
          alert('An error occurred doing the save');
        },
        success: _.bind(function() {
          
          Origin.trigger('editingOverlay:views:hide');
          
          Origin.trigger('editor:refreshData', function() {
            Backbone.history.history.back();
            this.remove();
          }, this);
          
        }, this)
      })
    }
  },
  {
    template: 'editorConfigEdit'
  });

  return EditorConfigEditView;

});
