// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('editorGlobal/views/editorOriginView');

  var EditorComponentEditView = EditorOriginView.extend({
    tagName: "div",
    className: "component-edit",

    preRender: function() {
      this.listenTo(Origin, 'editorComponentEditSidebar:views:save', this.save);
      this.model.set('ancestors', this.model.getPossibleAncestors().toJSON());
    },

    cancel: function (event) {
      event.preventDefault();
      Origin.trigger('editorSidebarView:removeEditView', this.model);
    },

    /*
    getAttributesToSave: function() {
      // TODO look into this, always seems undefined
      this.model.set('_componentType', this.model.get('_componentType')._id);
      return EditorOriginView.prototype.getAttributesToSave.apply(this, arguments);
    },
    */
  },
  {
    template: 'editorComponentEdit'
  });

  return EditorComponentEditView;
});
