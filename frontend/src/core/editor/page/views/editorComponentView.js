define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('editorGlobal/views/editorOriginView');
  var EditorComponentModel = require('editorPage/models/editorComponentModel');

  var EditorComponentView = EditorOriginView.extend({

    tagName: 'div',

    className: 'component editable component-draggable',

    events: _.extend({
      'click a.component-delete'        : 'deleteComponentPrompt',
      'click a.open-context-component'  : 'openContextMenu',
      'dblclick':'loadComponentEdit'
    }, EditorOriginView.prototype.events),

    preRender: function() {
      this.listenTo(Origin, 'editorView:removeSubViews', this.remove);
      this.listenTo(Origin, 'editorPageView:removePageSubViews', this.remove);
      this.listenTo(Origin, 'editorPageView:deleteComponent:' + this.model.get('_id'), this.deleteComponent);
      
      this.on('contextMenu:component:edit', this.loadComponentEdit);
      this.on('contextMenu:component:copy', this.onCopy);
      this.on('contextMenu:component:cut', this.onCut);
      this.on('contextMenu:component:delete', this.deleteComponentPrompt);

    },

    postRender: function () {
      this.$el.addClass('component-' + this.model.get('_layout'));
      this.setupDragDrop();

      _.defer(_.bind(function(){
        this.trigger('componentView:postRender');
        Origin.trigger('pageView:itemRendered');
      }, this));
    },

    deleteComponentPrompt: function(event) {
      if (event) {
        event.preventDefault();
      }
      var id = this.model.get('_id');
      var deletePrompt = {
          _type: 'prompt',
          _showIcon: true,
          title: window.polyglot.t('app.deletecomponent'),
          body: window.polyglot.t('app.confirmdeletecomponent') + '<br />' + '<br />' + window.polyglot.t('app.confirmdeletecomponentwarning'),
          _prompts: [
            {_callbackEvent: 'editorPageView:deleteComponent:' + id, promptText: window.polyglot.t('app.ok')},
            {_callbackEvent: '', promptText: window.polyglot.t('app.cancel')}
          ]
        };

      Origin.trigger('notify:prompt', deletePrompt);
    },

    deleteComponent: function() {
      var parentId = this.model.get('_parentId');

      if (this.model.destroy()) {
          this.remove();
          Origin.trigger('editorView:removeComponent:' + parentId);   
        }
    },

    loadComponentEdit: function () {
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
