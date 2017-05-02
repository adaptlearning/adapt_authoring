// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('core/origin');
  var EditorOriginView = require('../../global/views/editorOriginView');

  var EditorArticleEditView = EditorOriginView.extend({
    className: "article-edit",
    tagName: "div",

    preRender: function() {
      this.listenTo(Origin, 'editorArticleEditSidebar:views:save', this.save);
      this.model.set('ancestors', this.model.getPossibleAncestors().toJSON());
    }
  }, {
    template: 'editorArticleEdit'
  });

  return EditorArticleEditView;
});
