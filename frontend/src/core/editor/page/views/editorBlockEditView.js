// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('editorGlobal/views/editorOriginView');

  var EditorBlockEditView = EditorOriginView.extend({

    tagName: "div",

    className: "block-edit",

    preRender: function() {
      this.listenTo(Origin, 'editorBlockEditSidebar:views:save', this.saveBlock);
      this.model.set('ancestors', this.model.getPossibleAncestors().toJSON());
    },

    saveBlock: function() {
      var self = this;
      var errors = self.form.validate();
      // This must trigger no matter what, as sidebar needs to know
      // when the form has been resubmitted
      Origin.trigger('editorSidebar:showErrors', errors);
      if (errors) {
        return;
      }
      self.form.commit();

      self.model.pruneAttributes();

      self.model.save(null, {
        error: function() {
          Origin.Notify.alert({
            type: 'error',
            text: window.polyglot.t('app.errorsave')
          });
          
          Origin.trigger('sidebar:resetButtons');
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
    template: 'editorBlockEdit'
  });

  return EditorBlockEditView;

});
