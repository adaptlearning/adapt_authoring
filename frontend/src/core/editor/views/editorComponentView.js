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
      'click a.component-delete'  : 'deleteComponent',
      'click .paste-component'    : 'onPaste',
      'click .paste-cancel'       : 'pasteCancel',
      'click div.open-context-component' : 'openContextMenu'
    },

    preRender: function() {
      this.listenTo(Origin, 'editorView:removeSubViews', this.remove);
      this.listenTo(Origin, 'editorPageView:removePageSubViews', this.remove);
      this.on('contextMenu:component:edit', this.loadPageEdit);
      this.on('contextMenu:component:copy', this.onCopy);
      this.on('contextMenu:component:delete', this.deleteComponent);
    },

    deleteComponent: function(event) {
      if (event) {
        event.preventDefault();
      }
      var parentId = this.model.get('_parentId');

      if (confirm(window.polyglot.t('app.confirmdeletecomponent'))) {
        if (this.model.destroy()) {
          this.remove();
          Origin.trigger('editorView:removeComponent:' + parentId);
        }
      }
    },

    loadPageEdit: function (event) {
      if (event) {
        event.preventDefault();
      }
      Origin.trigger('editorSidebarView:addEditView', this.model);
    }

  }, {
    template: 'editorComponent'
  });

  return EditorComponentView;

});
