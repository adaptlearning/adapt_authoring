// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('editorGlobal/views/editorOriginView');

  var EditorArticleEditView = EditorOriginView.extend({
    tagName: "div",
    className: "article-edit",

    preRender: function() {
      this.listenTo(Origin, 'editorArticleEditSidebar:views:save', this.save);
      this.model.set('ancestors', this.model.getPossibleAncestors().toJSON());
    },
  },
  {
    template: 'editorArticleEdit'
  });

  return EditorArticleEditView;
});
