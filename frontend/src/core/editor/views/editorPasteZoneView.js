define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var EditorOriginView = require('coreJS/editor/views/editorOriginView');
  var Origin = require('coreJS/app/origin');

  var EditorPasteZone = EditorOriginView.extend({
    preRender: function() {
      this.listenTo(this.model, 'destroy', this.remove);
      this.listenTo(Origin, 'editorView:removeSubViews', this.remove);
      this.listenTo(Origin, 'editorPageView:removePageSubViews', this.remove);
    }
  }, {
    template: 'editorPasteZone'
  });

  return EditorPasteZone;

});
