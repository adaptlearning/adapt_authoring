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
      this.listenTo(Origin, 'editorConfigEditSidebar:views:save', this.save);
    },

    getAttributesToSave: function() {
      var changed = this.model.changedAttributes();
      if(!changed) {
        return null;
      }
      return _.extend(changed, mandatory);
    }
  },
  {
    template: 'editorConfigEdit'
  });

  return EditorConfigEditView;
});
