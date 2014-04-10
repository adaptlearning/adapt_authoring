define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('coreJS/editor/views/editorOriginView');
  var EditorComponentModel = require('coreJS/editor/models/editorComponentModel');

  var EditorComponentView = EditorOriginView.extend({

    tagName: 'div',

    className: 'component',

    events: {
      'click a.component-edit'    : 'loadPageEdit',
      'click a.component-delete'  : 'deleteComponent',
      'click .copy-component'     : 'onCopy',
      'click .paste-component'    : 'onPaste',
      'click .paste-cancel'       : 'pasteCancel'
    },

    preRender: function() {
      this.listenTo(Origin, 'editorView:removeSubViews', this.remove);
      this.listenTo(Origin, 'editorPageView:removePageSubViews', this.remove);
    },

    deleteComponent: function(event) {
      event.preventDefault();
      var parentId = this.model.get('_parentId');

      if (confirm(window.polyglot.t('app.confirmdeletecomponent'))) {
        if (this.model.destroy()) {
          this.remove();
          Origin.trigger('editorView:removeComponent:' + parentId);
        }
      }
    },

    loadPageEdit: function (event) {
      event.preventDefault();
      Origin.trigger('editorSidebarView:addEditView', this.model);
    }

  }, {
    template: 'editorComponent'
  });

  return EditorComponentView;

});
