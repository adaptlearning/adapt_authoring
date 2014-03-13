define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('coreJS/editor/views/editorOriginView');

  var EditorBlockView = EditorOriginView.extend({

    tagName: 'div',

    className: 'block',

    events: {
      'click a.block-edit'     : 'loadPageEdit',
      'click a.block-delete'   : 'deleteBlock',
      'click .copy-block'      : 'onCopy',
      'click .paste-component' : 'onPaste',
      'click .paste-cancel'    : 'pasteCancel'
    },

    preRender: function() {
      this.listenTo(Origin, 'editorView:removeSubViews', this.remove);
      this.listenTo(Origin, 'editorPageView:removePageSubViews', this.remove);
    },

    deleteBlock: function(event) {
      event.preventDefault();

      if (confirm('Are you sure you want to delete this block?')) {
        if (this.model.destroy()) {
          this.remove();
        }
      }
    },

    loadPageEdit: function (event) {
      event.preventDefault();
      Origin.trigger('editorSidebarView:addEditView', this.model);
    }

  }, {
    template: 'editorBlock'
  });

  return EditorBlockView;

});
