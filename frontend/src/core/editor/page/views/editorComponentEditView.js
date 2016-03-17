// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('editorGlobal/views/editorOriginView');

  var EditorComponentEditView = EditorOriginView.extend({

    tagName: "div",

    className: "component-edit",

    preRender: function() {
      this.listenTo(Origin, 'editorComponentEditSidebar:views:save', this.saveComponent);
      this.model.set('ancestors', this.model.getPossibleAncestors().toJSON());
    },

    cancel: function (event) {
      event.preventDefault();
      Origin.trigger('editorSidebarView:removeEditView', this.model);
    },

    saveComponent: function() {
      var self = this;
      var errors = self.form.commit();
      // This must trigger no matter what, as sidebar needs to know
      // when the form has been resubmitted
      Origin.trigger('editorSidebar:showErrors', errors);
      if (errors) {
        return;
      }

      self.model.set('_componentType', self.model.get('_componentType')._id);

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
            var currentPageId = self.model.getParent().getParent().getParent().get('_id');
            var currentCourseId = Origin.editor.data.course.get('_id');
            Backbone.history.navigate('#/editor/' + currentCourseId + '/page/' + currentPageId);
            self.remove();
          }, this);

        }, this)
      });
    }
  },
  {
    template: 'editorComponentEdit'
  });

  return EditorComponentEditView;

});
