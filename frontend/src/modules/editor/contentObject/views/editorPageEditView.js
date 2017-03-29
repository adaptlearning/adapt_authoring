// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('core/origin');
  var EditorOriginView = require('../../global/views/editorOriginView');

  var EditorPageEditView = EditorOriginView.extend({
    className: "page-edit",
    tagName: "div",

    preRender: function() {
      this.listenTo(Origin, 'editorPageEditSidebar:views:save', this.save);
    }
  }, {
    template: 'editorPageEdit'
  });

  return EditorPageEditView;
});
