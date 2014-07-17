define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('editorGlobal/views/editorOriginView');
  var EditorComponentModel = require('editorPage/models/editorComponentModel');
  var EditorComponentView = require('editorPage/views/editorComponentView');
  var EditorComponentPasteZoneView = require('editorPage/views/editorComponentPasteZoneView');

  var EditorBlockView = EditorOriginView.extend({

    tagName: 'div',

    className: 'block editable block-draggable',

    events: _.extend(EditorOriginView.prototype.events, {
      'click a.block-delete'        : 'deleteBlock',
      'click a.add-component'       : 'showComponentList',
      'click a.paste-block'         : 'onPaste',
      'click a.open-context-block'  : 'openContextMenu'
    }),

    preRender: function() {
      this.listenTo(Origin, 'editorView:removeSubViews', this.remove);
      this.listenTo(Origin, 'editorPageView:removePageSubViews', this.remove);
      this.listenTo(Origin, 'editorView:removeComponent:' + this.model.get('_id'), this.handleRemovedComponent);
      this.listenTo(Origin, 'editorView:moveComponent:' + this.model.get('_id'), this.reRender);
      this.listenTo(Origin, 'editorView:cutComponent:' + this.model.get('_id'), this.onCutComponent);
      this.listenTo(Origin, 'editorView:addComponent:' + this.model.get('_id'), this.addComponent);

      this.on('contextMenu:block:edit', this.loadPageEdit);
      this.on('contextMenu:block:copy', this.onCopy);
      this.on('contextMenu:block:cut', this.onCut);
      this.on('contextMenu:block:delete', this.deleteBlock);

      // Add a componentTypes property to the model and call toJSON() on the
      // collection so that the templates work
      this.model.set('componentTypes', Origin.editor.data.componentTypes.toJSON());

      this.evaluateComponents();
    },

    postRender: function() {
      this.addComponentViews();
      this.setupDragDrop();

      _.defer(_.bind(function(){
        this.trigger('blockView:postRender');
        Origin.trigger('pageView:itemRendered');
      }, this));
    },

    evaluateComponents: function() {
      var layoutOptions = [
      {
        type: 'left',
        name: 'app.layoutleft',
        pasteZoneRenderOrder: 2
      },
      {
        type: 'full',
        name: 'app.layoutfull',
        pasteZoneRenderOrder: 1
      },
      {
        type: 'right',
        name: 'app.layoutright',
        pasteZoneRenderOrder: 3
      }];

      this.model.getChildren().each(function(component) {
        this.$('.page-article-components').append(new EditorComponentView({model: component}).$el);

        switch (component.get('_layout')) {
          case 'full':
            layoutOptions = null;
            break;
          case 'left':
            layoutOptions.splice(_.indexOf(layoutOptions, _.findWhere(layoutOptions, { type : "full"})), 1);
            layoutOptions.splice(_.indexOf(layoutOptions, _.findWhere(layoutOptions, { type : "left"})), 1);
            break;
          case 'right':
            layoutOptions.splice(_.indexOf(layoutOptions, _.findWhere(layoutOptions, { type : "full"})), 1);
            layoutOptions.splice(_.indexOf(layoutOptions, _.findWhere(layoutOptions, { type : "right"})), 1);
            break;
        }
      }, this);

      var dragLayoutOptions = [];
      var components = this.model.getChildren();
      if (components.length === 1) {
        switch (components.at(0).get('_layout')) {
          case 'full':
            dragLayoutOptions.push({type: 'left', name: 'app.layoutleft'});
            dragLayoutOptions.push({type: 'right', name: 'app.layoutright'});
            break;
          case 'left':
            dragLayoutOptions.push({type: 'full', name: 'app.layoutfull'});
            break;
          case 'right':
            dragLayoutOptions.push({type: 'full', name: 'app.layoutfull'});
            break;
        }
      }

      this.model.set('layoutOptions', layoutOptions);
      this.model.set('dragLayoutOptions', dragLayoutOptions);
    },

    handleRemovedComponent: function() {
      this.evaluateComponents();
      this.render();
    },

    reRender: function() {
      this.evaluateComponents();
      this.render();
    },

    onCutComponent: function(view) {
      this.once('blockView:postRender', function() {
        view.showPasteZones();
      });

      this.evaluateComponents();
      this.render();
    },

    setupDragDrop: function() {
      var view = this;
      this.$el.draggable({
        opacity: 0.8,
        handle: '.handle',
        revert: 'invalid',
        zIndex: 10000,
        cursorAt: {
          top: 10,
          left: 10
        },
        helper: function (e) {
          return $('<div class="drag-helper">' + view.model.get('title') + '</div>');
        },
        start: function () {
          view.showDropZones();
          $(this).attr('data-' + view.model.get('_type') + '-id', view.model.get('_id'));
          $(this).attr('data-' + view.model.get('_parent') + '-id', view.model.get('_parentId'));
        },
        stop: function () {
          view.hideDropZones();
        }
      });
    },

    addComponentViews: function() {
      this.$('.page-article-components').empty();
      var components = this.model.getChildren();
      var addPasteZonesFirst = components.length && components.at(0).get('_layout') != 'full';

      if (addPasteZonesFirst) {
        this.setupPasteZones();
      }

      // Add component elements
      this.model.getChildren().each(function(component) {
        this.$('.page-article-components').append(new EditorComponentView({model: component}).$el);
      }, this);

      if (!addPasteZonesFirst) {
        this.setupPasteZones();
      }
    },

    deleteBlock: function(event) {
      if (event) {
        event.preventDefault();
      }

      if (confirm(window.polyglot.t('app.confirmdeleteblock'))) {
        if (this.model.destroy()) {
          this.remove();
          Origin.trigger('editorView:fetchData');
        }
      }
    },

    loadPageEdit: function (event) {
      Origin.router.navigate('#/editor/' + this.model.get('_type') + '/' + this.model.get('_id') + '/edit', {trigger: true});
    },

    showComponentList: function(event) {
      event.preventDefault();

      Origin.router.navigate('#/editor/'+ this.model.get('_id') +'/component/add', {trigger: true});
      /*var props = {
        _type: 'popup',
        _showIcon: true,
        title: window.polyglot.t('app.addcomponent'),
        body: window.polyglot.t('app.pleaseselectcomponent'),
        componentTypes: Origin.editor.data.componentTypes.toJSON(),
        layoutOptions: this.model.get('layoutOptions'),
        _prompts: [
          {_callbackEvent: 'editorView:addComponent:' + this.model.get('_id'), promptText: window.polyglot.t('app.ok')},
          {_callbackEvent:'', promptText: window.polyglot.t('app.cancel')}
        ]
      };

      Origin.trigger('notify:prompt', props);*/
    },

    addComponent: function(data) {

      /*if (!data.componentType || !data.layout) {
        return;
      }

      var componentType = _.find(Origin.editor.data.componentTypes.models, function(type){
        return type.get('name') == data.componentType;
      });

      var _this = this;
      var newComponentModel = new EditorComponentModel();

      newComponentModel.save({
        title: '',
        displayTitle: '',
        body: '',
        _parentId: _this.model.get('_id'),
        _courseId: Origin.editor.data.course.get('_id'),
        _type: 'component',
        _componentType: componentType.get('_id'),
        _component: componentType.get('component'),
        _layout: data.layout,
        version: componentType.get('version')
      },
      {
        error: function() {
          alert('error adding new component');
        },
        success: function() {
          Origin.trigger('editorView:fetchData');
        }
      });*/
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
        var pasteComponent = new EditorComponentModel();
        pasteComponent.set('_parentId', this.model.get('_id'));
        pasteComponent.set('_type', 'component');
        pasteComponent.set('_pasteZoneLayout', layout.type);
        var $pasteEl = new EditorComponentPasteZoneView({model: pasteComponent}).$el;
        $pasteEl.addClass('drop-only');
        this.$('.page-article-components').append($pasteEl);
      }, this);

      _.each(this.sortArrayByKey(layouts, 'pasteZoneRenderOrder'), function(layout) {
        var pasteComponent = new EditorComponentModel();
        pasteComponent.set('_parentId', this.model.get('_id'));
        pasteComponent.set('_type', 'component');
        pasteComponent.set('_pasteZoneLayout', layout.type);
        this.$('.page-article-components').append(new EditorComponentPasteZoneView({model: pasteComponent}).$el);
      }, this);
    },

    swapLayout: function (layout) {
      var newLayout = 'full';
      if (layout != 'full') {
        newLayout = (layout == 'left') ? 'right' : 'left';
      }
      return newLayout;
    }

  }, {
    template: 'editorBlock'
  });

  return EditorBlockView;

});
