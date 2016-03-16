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
      'click a.component-move'          : 'evaluateMove',
      'click a.open-context-component'  : 'openContextMenu',
      'dblclick'                        : 'loadComponentEdit'
    }, EditorOriginView.prototype.events),

    preRender: function() {
      this.$el.addClass('component-' + this.model.get('_layout'));
      this.listenTo(Origin, 'editorView:removeSubViews', this.remove);
      this.listenTo(Origin, 'editorPageView:removePageSubViews', this.remove);

      this.evaluateLayout();

      this.on('contextMenu:component:edit', this.loadComponentEdit);
      this.on('contextMenu:component:copy', this.onCopy);
      this.on('contextMenu:component:copyID', this.onCopyID),
      this.on('contextMenu:component:cut', this.onCut);
      this.on('contextMenu:component:delete', this.deleteComponentPrompt);
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
        type: 'warning',
        title: window.polyglot.t('app.deletecomponent'),
        text: window.polyglot.t('app.confirmdeletecomponent') + '<br />' + '<br />' + window.polyglot.t('app.confirmdeletecomponentwarning'),
        callback: _.bind(this.deleteComponentConfirm, this)
      });

    },

    deleteComponentConfirm: function(confirmed) {
      confirmed && this.deleteComponent();
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
    },

    evaluateLayout: function() {
      var movePositions = {
        left: false,
        right: false,
        full: false
      };

      var siblings = this.model.getSiblings();
      var showFull = !siblings.length;
      var type = this.model.get('_layout');
      switch (type) {
        case 'left':
          movePositions.right = true;
          movePositions.full = showFull;
          break;
        case 'right':
          movePositions.left = true;
          movePositions.full = showFull;
          break;
        case 'full':
          movePositions.left = true;
          movePositions.right = true;
          break
      }

      this.model.set('_movePositions', movePositions);

    },

    evaluateMove: function(event) {
      event.preventDefault();
      var left = $(event.currentTarget).hasClass('component-move-left');
      var right = $(event.currentTarget).hasClass('component-move-right');
      var newComponentLayout = (!left && !right) ? 'full' : (left ? 'left' : 'right');
      var siblings = this.model.getSiblings();

      if (siblings && siblings.length > 0) {
        var siblingId = siblings.models[0].get('_id');
      }

      if (siblingId) {
        this.moveSiblings(newComponentLayout, siblingId);
      } else {
        this.moveComponent(newComponentLayout);
      }
    },

    moveComponent: function (layout) {
      var componentId = this.model.get('_id');
      var parentId = this.model.get('_parentId');
      var layoutData = {
        _layout: layout,
        _parentId: parentId
      };

      $.ajax({
        type: 'PUT',
        url:'/api/content/component/' + componentId,
        data: layoutData,
        success: function(jqXHR, textStatus, errorThrown) {
          var componentModel = Origin.editor.data.components.get(componentId);
          componentModel.set(layoutData);

          // Re-render the block
          Origin.trigger('editorView:moveComponent:' + parentId);
        },
        error: function(jqXHR, textStatus, errorThrown) {
          Origin.Notify.alert({
            type: 'error',
            text: jqXHR.responseJSON.message
          });
        }
      });
    },

    moveSiblings: function (layout, siblingId) {
      var componentId = this.model.get('_id');
      var parentId = this.model.get('_parentId');
      var newSiblingLayout = (layout == 'left') ? 'right' : 'left';
      var layoutData = {
        newLayout: {
          _layout: layout,
          _parentId: parentId
        },
        siblingLayout: {
          _layout: newSiblingLayout,
          _parentId: parentId
        }
      };
      $.ajax({
        type: 'PUT',
        url:'/api/content/component/switch/' + componentId +'/'+ siblingId,
        data: layoutData,
        success: function(jqXHR, textStatus, errorThrown) {
          var componentModel = Origin.editor.data.components.get(componentId);
          componentModel.set(layoutData.newLayout);

          var siblingModel = Origin.editor.data.components.get(siblingId);
          siblingModel.set(layoutData.siblingLayout);

          // Re-render the block
          Origin.trigger('editorView:moveComponent:' + parentId);
        },
        error: function(jqXHR, textStatus, errorThrown) {
          Origin.Notify.alert({
            type: 'error',
            text: jqXHR.responseJSON.message
          });
        }
      });
    }

  }, {
    template: 'editorComponent'
  });

  return EditorComponentView;

});
