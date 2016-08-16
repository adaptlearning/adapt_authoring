// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('editorGlobal/views/editorOriginView');

  var EditorBlockEditView = EditorOriginView.extend({
    tagName: "div",
    className: "block-edit",

    preRender: function() {
      this.listenTo(Origin, 'editorBlockEditSidebar:views:save', this.save);
      this.model.set('ancestors', this.model.getPossibleAncestors().toJSON());
    }
  },
  {
    template: 'editorBlockEdit'
  });

  return EditorBlockEditView;
});
