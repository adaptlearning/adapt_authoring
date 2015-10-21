// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
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
      'dblclick'                        : 'loadComponentEdit'
    }, EditorOriginView.prototype.events),

    preRender: function() {
      this.$el.addClass('component-' + this.model.get('_layout'));
      this.listenTo(Origin, 'editorView:removeSubViews', this.remove);
      this.listenTo(Origin, 'editorPageView:removePageSubViews', this.remove);
      this.listenTo(this.model, 'sync', this.setupModelEvents);
      if (!this.model.isNew()) {
        this.setupModelEvents();
      }

      this.on('contextMenu:component:edit', this.loadComponentEdit);
      this.on('contextMenu:component:copy', this.onCopy);
      this.on('contextMenu:component:cut', this.onCut);
      this.on('contextMenu:component:delete', this.deleteComponentPrompt);
    },

    setupModelEvents: function() {
      this.listenTo(Origin, 'editorPageView:deleteComponent:' + this.model.get('_id'), this.deleteComponent);
    },

    postRender: function () {
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

      Origin.Notify.confirm({
        title: window.polyglot.t('app.deletecomponent'),
        text: window.polyglot.t('app.confirmdeletecomponent') + '<br />' + '<br />' + window.polyglot.t('app.confirmdeletecomponentwarning'),
        html: true,
        closeOnConfirm: true,
        confirmButtonText: window.polyglot.t('app.ok'),
        cancelButtonText: window.polyglot.t('app.cancel'),
        callback: _.bind(this.deleteComponentConfirm, this)
      });

    },

    deleteComponentConfirm: function(confirmed) {
      if (confirmed) {
        var id = this.model.get('_id');
        Origin.trigger('editorPageView:deleteComponent:' + id);
      }
    },

    deleteComponent: function() {
      var parentId = this.model.get('_parentId');

      if (this.model.destroy()) {
        this.remove();
        Origin.trigger('editorView:removeComponent:' + parentId);
      }
    },

    loadComponentEdit: function () {
      var courseId = Origin.editor.data.course.get('_id');
      var type = this.model.get('_type');
      var Id = this.model.get('_id');
      Origin.router.navigate('#/editor/'
        + courseId
        + '/'
        + type
        + '/'
        + Id
        + '/edit', {trigger: true});
    },

    setupDragDrop: function() {
      var view = this;
      this.$el.draggable({
        opacity: 0.8,
        handle: '.handle',
        revert: 'invalid',
        zIndex: 10000,
        cursorAt: {
          top: 22,
          left: 0
        },
        appendTo:'.editor-view',
        containment: '.editor-view',
        helper: function (e) {
          // Store the offset to stop the page jumping during the start of drag
          // because of the drop zones changing the scroll position on the page
          view.offsetTopFromWindow = view.$el.offset().top - $(window).scrollTop();
          // This is in the helper method because the height needs to be
          // manipulated before the drag start method due to adding drop zones
          view.showDropZones();
          $(this).attr('data-component-id', view.model.get('_id'));
          $(this).attr('data-block-id', view.model.get('_parentId'));
          return $('<div class="drag-helper">' + view.model.get('title') + '</div>');
        },
        start: function(event) {
          // Using the initial offset we're able to position the window back in place
          $(window).scrollTop(view.$el.offset().top -view.offsetTopFromWindow);
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
