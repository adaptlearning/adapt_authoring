// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Backbone = require('backbone');
  var Origin = require('core/origin');
  var ComponentModel = require('core/models/componentModel');
  var EditorOriginView = require('../../global/views/editorOriginView');
  var EditorPageComponentView = require('./editorPageComponentView');
  var EditorPageComponentPasteZoneView = require('./editorPageComponentPasteZoneView');
  var EditorPageComponentListView = require('./editorPageComponentListView');

  var EditorPageBlockView = EditorOriginView.extend({
    className: 'block editable block-draggable page-content-syncing',
    tagName: 'div',

    settings: _.extend({}, EditorOriginView.prototype.settings, {
      hasAsyncPostRender: true,
      autoRender: false
    }),

    events: _.extend({}, EditorOriginView.prototype.events, {
      'click .block-delete': 'deleteBlockPrompt',
      'click .add-component': 'showComponentList',
      'click .open-context-block': 'openContextMenu',
      'dblclick': 'loadBlockEdit'
    }),

    preRender: function() {
      this.listenToEvents();
      this.model.set('componentTypes', Origin.editor.data.componenttypes.toJSON());
      this.render();
    },

    render: function() {
      this.model.fetchChildren(_.bind(function(components) {
        this.children = components;
        var layouts = this.getAvailableLayouts();
        // FIXME why do we have two attributes with the same value?
        this.model.set({ layoutOptions: layouts, dragLayoutOptions: layouts });

        EditorOriginView.prototype.render.apply(this);

        this.addComponentViews();
        this.setupDragDrop();

        this.handleAsyncPostRender();
      }, this));
    },

    animateIn: function() {
      this.$el.velocity({
        scale: [1, 0.95],
        opacity: [1, 0.4]
      }, {
        duration: 400,
        begin: function() {
          this.$el.removeClass('page-content-syncing');
        }.bind(this),
        complete: function() {
          Origin.trigger('pageView:itemAnimated', this);
        }.bind(this)
      })
    },

    handleAsyncPostRender: function() {
      var renderedChildren = [];
      if(this.children.length === 0) {
        return this.animateIn();
      }
      this.listenTo(Origin, 'editorPageComponent:postRender', function(view) {
        var id = view.model.get('_id');
        if(this.children.indexOf(view.model) !== -1 && renderedChildren.indexOf(id) === -1) {
          renderedChildren.push(id);
        }
        if(renderedChildren.length === this.children.length) {
          this.stopListening(Origin, 'editorPageComponent:postRender');
          this.animateIn();
        }
      });
    },

    listenToEvents: function() {
      var id = this.model.get('_id');
      var events = {
        'editorView:removeSubViews editorPageView:removePageSubViews': this.remove
      };
      events[
        'editorView:addComponent:' + id + ' ' +
        'editorView:removeComponent:' + id + ' ' +
        'editorView:moveComponent:' + id
      ] = this.render;
      events['editorView:pasted:' + id] = this.onPaste;
      this.listenTo(Origin, events);

      this.listenTo(this, {
        'contextMenu:block:edit': this.loadBlockEdit,
        'contextMenu:block:copy': this.onCopy,
        'contextMenu:block:copyID': this.onCopyID,
        'contextMenu:block:delete': this.deleteBlockPrompt
      });
    },

    postRender: function() {
      this.trigger('blockView:postRender');
      Origin.trigger('pageView:itemRendered', this);
    },

    getAvailableLayouts: function() {
      var layoutOptions = {
        full: { type: 'full', name: 'app.layoutfull', pasteZoneRenderOrder: 1 },
        left: { type: 'left', name: 'app.layoutleft', pasteZoneRenderOrder: 2 },
        right: { type: 'right', name: 'app.layoutright', pasteZoneRenderOrder: 3 }
      };
      if (this.children.length === 0) {
        return [layoutOptions.full,layoutOptions.left,layoutOptions.right];
      }
      if (this.children.length === 1) {
        var layout = this.children[0].get('_layout');
        if(layout === layoutOptions.left.type) return [layoutOptions.right];
        if(layout === layoutOptions.right.type) return [layoutOptions.left];
      }
      return [];
    },

    deleteBlockPrompt: function(event) {
      event && event.preventDefault();

      Origin.Notify.confirm({
        type: 'warning',
        title: Origin.l10n.t('app.deleteblock'),
        text: Origin.l10n.t('app.confirmdeleteblock') + '<br />' + '<br />' + Origin.l10n.t('app.confirmdeleteblockwarning'),
        callback: _.bind(function(confirmed) {
          if (confirmed) this.deleteBlock();
        }, this)
      });
    },

    deleteBlock: function(event) {
      this.model.destroy({
        success: _.bind(this.remove, this),
        error: function(model, response) {
          Origin.Notify.alert({ type: 'error', text: Origin.l10n.t('app.errorgeneric') });
        }
      });
    },

    setupDragDrop: function() {
      var view = this;
      var autoScrollTimer = false;
      var $container = $('.contentPane');

      this.$el.draggable({
        opacity: 0.8,
        handle: '.handle',
        revert: 'invalid',
        zIndex: 10000,
        cursorAt: {
          top: 22,
          left: 0
        },
        appendTo:'.app-inner',
        containment: '.app-inner',
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

          if(clientY < (offsetTop + SCROLL_THRESHOLD)) {
            scrollAmount = -SCROLL_INCREMENT;
          }
          else if(clientY > (($container.height() + offsetTop) - SCROLL_THRESHOLD)) {
            scrollAmount = SCROLL_INCREMENT;
          }

          if(scrollAmount) {
            autoScrollTimer = window.setInterval(function() {
              $container.scrollTop($container.scrollTop() + scrollAmount);
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

      var addPasteZonesFirst = this.children.length && this.children[0].get('_layout') !== 'full';
      this.addComponentButtonLayout(this.children);

      if (addPasteZonesFirst) this.setupPasteZones();
      // Add component elements
      for(var i = 0, count = this.children.length; i < count; i++) {
        var view = new EditorPageComponentView({ model: this.children[i] });
        this.$('.page-components').append(view.$el);
      }
      if (!addPasteZonesFirst) this.setupPasteZones();
    },

    addComponentButtonLayout: function(components) {
      if(components.length === 2) {
        return;
      }
      if(components.length === 0) {
        this.$('.add-component').addClass('full');
        return;
      }
      var layout = components[0].get('_layout');
      var className = '';
      if(layout === 'left') className = 'right';
      if(layout === 'right') className = 'left';
      this.$('.add-component').addClass(className);
    },

    loadBlockEdit: function (event) {
      var courseId = Origin.editor.data.course.get('_id');
      var type = this.model.get('_type');
      var id = this.model.get('_id');
      Origin.router.navigateTo('editor/' + courseId + '/' + type + '/' + id + '/edit');
    },

    showComponentList: function(event) {
      event.preventDefault();
      // If adding a new component
      // get current layoutOptions
      var layoutOptions = this.model.get('layoutOptions');

      var componentSelectModel = new Backbone.Model({
        title: Origin.l10n.t('app.addcomponent'),
        body: Origin.l10n.t('app.pleaseselectcomponent'),
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
      var layouts = this.model.get('layoutOptions').slice();
      var dragLayouts = this.model.get('dragLayoutOptions').slice();

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

    onPaste: function(data) {
      (new ComponentModel({ _id: data._id })).fetch({
        success: _.bind(function(model) {
          this.children.push(model);
          this.render();
        }, this),
        error: function(data) {
          Origin.Notify.alert({
            type: 'error',
            text: 'app.errorfetchingdata'
          });
        }
      });
    }

  }, {
    template: 'editorPageBlock'
  });

  return EditorPageBlockView;

});
