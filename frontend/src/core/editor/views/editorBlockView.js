define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('coreJS/editor/views/editorOriginView');
  var EditorComponentModel = require('coreJS/editor/models/editorComponentModel');
  var EditorComponentView = require('coreJS/editor/views/editorComponentView');

  var EditorBlockView = EditorOriginView.extend({

    tagName: 'div',

    className: 'block editable',

    events: _.extend(EditorOriginView.prototype.events, {
      'click a.block-delete'   : 'deleteBlock',     
      'click a.add-component'  : 'addComponent',
      'click a.paste-block'         : 'onPaste',
      'click a.open-context-block' : 'openContextMenu'
    }),

    preRender: function() {
      this.listenTo(Origin, 'editorView:removeSubViews', this.remove);
      this.listenTo(Origin, 'editorPageView:removePageSubViews', this.remove);
      this.listenTo(Origin, 'editorView:removeComponent:' + this.model.get('_id'), this.handleRemovedComponent);
      this.on('contextMenu:block:edit', this.loadPageEdit);
      this.on('contextMenu:block:copy', this.onCopy);
      this.on('contextMenu:block:delete', this.deleteBlock);

      // Add a componentTypes property to the model and call toJSON() on the
      // collection so that the templates work
      this.model.set('componentTypes', Origin.editor.componentTypes.toJSON());

      this.evaluateComponents();
      this.setupPasteZone();
    },

    postRender: function() {
      this.addComponentViews();
    },

    evaluateComponents: function() {
      var layoutOptions = [{
        type: 'full',
        name: 'app.layoutfull'
      },
      {
        type: 'left',
        name: 'app.layoutleft'
      },
      {
        type: 'right',
        name: 'app.layoutright'
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

      this.model.set('layoutOptions', layoutOptions);
    },

    handleRemovedComponent: function() {
      this.evaluateComponents();
      this.setupPasteZone();
      this.render();
    },

    addComponentViews: function() {
      this.$('.page-article-components').find('.component').remove();

      this.model.getChildren().each(function(component) {
        this.$('.page-article-components').append(new EditorComponentView({model: component}).$el);
      }, this);
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
      if (event) {
        event.preventDefault();
      }
      Origin.trigger('editorSidebarView:addEditView', this.model);
    },

    addComponent: function(event) {
      event.preventDefault();

      // Retrieve from UI
      var layout = this.$('.add-component-form-layout').val();
      var selectedComponentType = this.$('.add-component-form-componentType').val();

      var componentType = _.find(Origin.editor.componentTypes.models, function(type){
        return type.get('name') == selectedComponentType;
      });

      var thisView = this;
      var newComponentModel = new EditorComponentModel();

      newComponentModel.save({
        title: window.polyglot.t('app.placeholdernewcomponent'),
        body: window.polyglot.t('app.placeholdereditthistext'),
        _parentId: thisView.model.get('_id'),
        _courseId: Origin.editor.data.course.get('_id'),
        _type: 'component',
        _componentType: componentType.get('_id'),
        _component: componentType.get('component'),
        _layout: layout,
        version: componentType.get('version')
      },
      {
        error: function() {
          alert('error adding new component');
        },
        success: function() {
          Origin.trigger('editorView:fetchData');
        }
      });
    },

    setupPasteZone: function() {
      if (this.model.getChildren().length == 1) {
        var component = this.model.getChildren().at(0);
        var hasPasteZone = component.get('_layout') == 'full' ? false : true;
        this.model.set('_hasPasteZone', hasPasteZone);
        this.model.set('_pasteZoneLayout', this.swapLayout(component.get('_layout')));
      } else if (this.model.getChildren().length == 0) {
        this.model.set('_hasPasteZone', true);
        this.model.set('_pasteZoneLayout', 'full');
        this.model.set('_pasteZoneShowAll', true);
      } else {
        this.model.set('_hasPasteZone', false);
      }
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
