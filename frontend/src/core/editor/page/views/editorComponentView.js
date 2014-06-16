define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('editorGlobal/views/editorOriginView');
  var EditorComponentModel = require('editorPage/models/editorComponentModel');

  var EditorComponentView = EditorOriginView.extend({

    tagName: 'div',

    className: 'component editable component-draggable',

    events: _.extend(EditorOriginView.prototype.events, {
      'click a.component-delete'        : 'deleteComponent',
      'click a.paste-component'         : 'onPaste',
      'click a.open-context-component'  : 'openContextMenu'
    }),

    preRender: function() {
      this.listenTo(Origin, 'editorView:removeSubViews', this.remove);
      this.listenTo(Origin, 'editorPageView:removePageSubViews', this.remove);
      
      this.on('contextMenu:component:edit', this.loadPageEdit);
      this.on('contextMenu:component:copy', this.onCopy);
      this.on('contextMenu:component:cut', this.onCut);
      this.on('contextMenu:component:delete', this.deleteComponent);
    },

    postRender: function () {
      this.$el.addClass('component-' + this.model.get('_layout'));
      this.setupDragDrop();
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

    loadPageEdit: function () {
      Origin.router.navigate('#/editor/' + this.model.get('_type') + '/' + this.model.get('_id') + '/edit', {trigger: true});
    },

    setupDragDrop: function() {
      var view = this;
      this.$el.draggable({
        opacity: 0.8,
        handle: '.handle',
        revert: 'invalid',
        zIndex: 10000,
        cursorAt: {
          top: 15,
          left: 10
        },
        helper: function (e) {
          return $('<div class="drag-helper">' + view.model.get('title') + '</div>');
        },
        start: function () {
          view.showDropZones();
          $(this).attr('data-component-id', view.model.get('_id'));
          $(this).attr('data-block-id', view.model.get('_parentId'));
        },
        stop: function () {
          view.hideDropZones();
        }
      });
    }

  }, {
    template: 'editorComponent'
  });

  return EditorComponentView;

});
