// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var Origin = require('core/app/origin');

  var ComponentModel = require('core/app/models/componentModel');
  var EditorOriginView = require('../../global/views/editorOriginView');
  var EditorPageComponentView = require('./editorPageComponentView');
  var EditorPageComponentPasteZoneView = require('./editorPageComponentPasteZoneView');
  var EditorPageComponentListView = require('./editorPageComponentListView');

  var EditorPageBlockView = EditorOriginView.extend({
    className: 'block editable block-draggable',
    tagName: 'div',

    settings: {
      autoRender: false
    },

    events: _.extend(EditorOriginView.prototype.events, {
      'click a.block-delete': 'deleteBlockPrompt',
      'click a.add-component': 'showComponentList',
      'click a.open-context-block': 'openContextMenu',
      'dblclick': 'loadBlockEdit'
    }),

    preRender: function() {
      this.listenToEvents();
      this.model.set('componentTypes', Origin.editor.data.componenttypes.toJSON());
      this.evaluateComponents(this.render);
    },

    listenToEvents: function() {
      this.listenTo(Origin, 'editorView:removeSubViews editorPageView:removePageSubViews', this.remove);

      this.listenTo(Origin, 'editorView:removeComponent:' + this.model.get('_id'), this.handleRemovedComponent);
      this.listenTo(Origin, 'editorView:moveComponent:' + this.model.get('_id'), this.reRender);
      this.listenTo(Origin, 'editorView:cutComponent:' + this.model.get('_id'), this.onCutComponent);
      this.listenTo(Origin, 'editorView:addComponent:' + this.model.get('_id'), this.addComponent);
      this.listenTo(Origin, 'editorView:deleteBlock:' + this.model.get('_id'), this.deleteBlock);

      this.listenTo(this, {
        'contextMenu:block:edit': this.loadBlockEdit,
        'contextMenu:block:copy': this.onCopy,
        'contextMenu:block:copyID': this.onCopyID,
        'contextMenu:block:cut': this.onCut,
        'contextMenu:block:delete': this.deleteBlockPrompt
      });
    },

    postRender: function() {
      this.addComponentViews();
      this.setupDragDrop();

      _.defer(_.bind(function(){
        this.trigger('blockView:postRender');
        Origin.trigger('pageView:itemRendered');
      }, this));
    },

    getAvailableLayouts: function() {
      var layoutOptions = {
        full: { type: 'full', name: 'app.layoutfull', pasteZoneRenderOrder: 1 },
        left: { type: 'left', name: 'app.layoutleft', pasteZoneRenderOrder: 2 },
        right: { type: 'right', name: 'app.layoutright', pasteZoneRenderOrder: 3 }
      };
      var components = this.model.getChildren();
      if (components.length === 0) {
        return [layoutOptions.full,layoutOptions.left,layoutOptions.right];
      }
      if (components.length === 1) {
        var layout = components.at(0).get('_layout');
        if(layout === 'left') return [layoutOptions.right];
        if(layout === 'right') return [layoutOptions.left];
      }
      return [];
    },

    evaluateComponents: function(callback) {
      this.model.set({
        layoutOptions: this.getAvailableLayouts(),
        dragLayoutOptions: this.getAvailableLayouts()
      });
      if(callback) callback.apply(this);
    },

    deleteBlockPrompt: function(event) {
      event && event.preventDefault();

      Origin.Notify.confirm({
        type: 'warning',
        title: window.polyglot.t('app.deleteblock'),
        text: window.polyglot.t('app.confirmdeleteblock') + '<br />' + '<br />' + window.polyglot.t('app.confirmdeleteblockwarning'),
        callback: _.bind(this.deleteBlockConfirm, this)
      });
    },

    deleteBlockConfirm: function(confirmed) {
      if (confirmed) {
        Origin.trigger('editorView:deleteBlock:' + this.model.get('_id'));
      }
    },

    deleteBlock: function(event) {
      this.model.destroy({
        success: _.bind(this.remove, this),
        error: function(model, response) {
          Origin.Notify.alert({ type: 'error', text: window.polyglot.t('app.errorgeneric') });
        }
      });
    },

    handleRemovedComponent: function() {
      this.evaluateComponents(this.render);
    },

    reRender: function() {
      this.evaluateComponents(this.render);
    },

    onCutComponent: function(view) {
      this.once('blockView:postRender', function() {
        view.showPasteZones();
      });

      this.evaluateComponents(this.render);
    },

    setupDragDrop: function() {
      var view = this;
      var autoScrollTimer = false;
      var $container = $('.page');

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
          $(this).attr('data-' + view.model.get('_type') + '-id', view.model.get('_id'));
          $(this).attr('data-' + view.model.get('_parent') + '-id', view.model.get('_parentId'));
          return $('<div class="drag-helper">' + view.model.get('title') + '</div>');
        },
        start: function(event) {
          // Using the initial offset we're able to position the window back in place
          $(window).scrollTop(view.$el.offset().top -view.offsetTopFromWindow);
        },
        drag: function(event) {
          window.clearInterval(autoScrollTimer);

          var SCROLL_THRESHOLD = $container.height()*0.2;
          var SCROLL_INCREMENT = 7;

          var offsetTop = $container.offset().top;
          var clientY = event.originalEvent.clientY;
          var scrollAmount;

          if (clientY < (offsetTop+SCROLL_THRESHOLD)) {
            scrollAmount = -SCROLL_INCREMENT;
          }
          else if (clientY > (($container.height()+offsetTop) - SCROLL_THRESHOLD)) {
            scrollAmount = SCROLL_INCREMENT;
          }

          if(scrollAmount) {
            autoScrollTimer = window.setInterval(function() {
              $container.scrollTop($container.scrollTop()+scrollAmount);
            }, 10);
          }
        },
        stop: function () {
          window.clearInterval(autoScrollTimer);
          view.hideDropZones();
          $container.scrollTop($(this).offset().top*-1);
        }
      });
    },

    addComponentViews: function() {
      this.$('.page-components').empty();
      var components = this.model.getChildren();
      var addPasteZonesFirst = components.length && components.at(0).get('_layout') != 'full';

      this.addComponentButtonLayout(components);

      if (addPasteZonesFirst) {
        this.setupPasteZones();
      }

      // Add component elements
      this.model.getChildren().each(function(component) {
        this.$('.page-components').append(new EditorPageComponentView({ model: component }).$el);
      }, this);

      if (!addPasteZonesFirst) {
        this.setupPasteZones();
      }
    },

    addComponentButtonLayout: function(components){
      if(components.length === 2) {
        return;
      }
      if(components.length === 0) {
        this.$('.add-component').addClass('full');
        return;
      }
      var className = (components.models[0].attributes._layout === 'left') ? 'right' : 'left';
      this.$('.add-component').addClass(className);
    },

    loadBlockEdit: function (event) {
      console.log('loadBlockEdit');
      var courseId = Origin.editor.data.course.get('_id');
      var type = this.model.get('_type');
      var id = this.model.get('_id');
      Origin.router.navigate('#/editor/' + courseId + '/' + type + '/' + id + '/edit', { trigger: true });
    },

    showComponentList: function(event) {
      event.preventDefault();
      // If adding a new component
      // get current layoutOptions
      var layoutOptions = this.model.get('layoutOptions');

      var componentSelectModel = new Backbone.Model({
        title: window.polyglot.t('app.addcomponent'),
        body: window.polyglot.t('app.pleaseselectcomponent'),
        _parentId: this.model.get('_id'),
        componentTypes: Origin.editor.data.componenttypes.toJSON(),
        layoutOptions: layoutOptions
      });

      $('body').append(new EditorPageComponentListView({
        model: componentSelectModel,
        $parentElement: this.$el,
        parentView: this
      }).$el);
    },

    setupPasteZones: function() {
      // Add available paste zones
      var layouts = [];
      var dragLayouts = [];

      _.each(this.model.get('dragLayoutOptions'), function (dragLayout) {
        dragLayouts.push(dragLayout);
      });
      _.each(this.model.get('layoutOptions'), function (layout) {
        layouts.push(layout);
      });

      _.each(this.sortArrayByKey(dragLayouts, 'pasteZoneRenderOrder'), function(layout) {
        var pasteComponent = new ComponentModel();
        pasteComponent.set('_parentId', this.model.get('_id'));
        pasteComponent.set('_type', 'component');
        pasteComponent.set('_pasteZoneLayout', layout.type);
        var $pasteEl = new EditorPageComponentPasteZoneView({ model: pasteComponent }).$el;
        $pasteEl.addClass('drop-only');
        this.$('.page-components').append($pasteEl);
      }, this);

      _.each(this.sortArrayByKey(layouts, 'pasteZoneRenderOrder'), function(layout) {
        var pasteComponent = new ComponentModel();
        pasteComponent.set('_parentId', this.model.get('_id'));
        pasteComponent.set('_type', 'component');
        pasteComponent.set('_pasteZoneLayout', layout.type);
        this.$('.page-components').append(new EditorPageComponentPasteZoneView({ model: pasteComponent }).$el);
      }, this);
    },

    swapLayout: function (layout) {
      if (layout === 'full') {
        return layout;
      }
      return (layout == 'left') ? 'right' : 'left';
    },

    toggleAddComponentsButton: function() {
      var layoutOptions = this.model.get('layoutOptions') || [];
      // display-none if we've no layout options
      this.$('.add-control').toggleClass('display-none', layoutOptions.length === 0);
    }
  }, {
    template: 'editorPageBlock'
  });

  return EditorPageBlockView;

});
