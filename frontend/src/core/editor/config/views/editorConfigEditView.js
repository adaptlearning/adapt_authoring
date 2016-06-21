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
      var errors = this.form.validate();
      // This must trigger no matter what, as sidebar needs to know
      // when the form has been resubmitted
      Origin.trigger('editorSidebar:showErrors', errors);
      if (errors) {
        return;
      }
      this.form.commit();

      // Ensure the _id is always passed.
      var attributesToUpdate = _.extend(this.model.changedAttributes(), 
        {_id: this.model.get('_id'), _courseId: this.model.get('_courseId')});
      
      this.model.save(attributesToUpdate, {
        patch: true,
        error: function() {
          Origin.Notify.alert({
            type: 'error',
            text: window.polyglot.t('app.errorsave')
          });
        },
        success: _.bind(function() {

          Origin.trigger('editingOverlay:views:hide');

          Origin.trigger('editor:refreshData', function() {
            Backbone.history.history.back();
            this.remove();
          }, this);

        }, this)
      });
    }
  },
  {
    template: 'editorConfigEdit'
  });

  return EditorConfigEditView;

});
