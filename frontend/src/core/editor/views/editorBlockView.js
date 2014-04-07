define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('coreJS/editor/views/editorOriginView');
  var EditorComponentModel = require('coreJS/editor/models/EditorComponentModel');
  var EditorComponentView = require('coreJS/editor/views/EditorComponentView');

  var EditorBlockView = EditorOriginView.extend({

    tagName: 'div',

    className: 'block',

    events: {
      'click a.block-edit'     : 'loadPageEdit',
      'click a.block-delete'   : 'deleteBlock',
      'click .copy-block'      : 'onCopy',
      'click .paste-component' : 'onPaste',
      'click .paste-cancel'    : 'pasteCancel',
      'click a.add-component'  : 'addComponent',
    },

    preRender: function() {
      this.listenTo(Origin, 'editorView:removeSubViews', this.remove);
      this.listenTo(Origin, 'editorPageView:removePageSubViews', this.remove);
      this.listenTo(Origin, 'editorView:removeComponent:' + this.model.get('_id'), this.handleRemovedComponent);

      // Add a componentTypes property to the model and call toJSON() on the
      // collection so that the templates work
      this.model.set('componentTypes', Origin.editor.componentTypes.toJSON());

      this.evaluateComponents();
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

      this.render();
    },

    addComponentViews: function() {
      this.$('.page-article-components').empty();

      this.model.getChildren().each(function(component) {
        this.$('.page-article-components').append(new EditorComponentView({model: component}).$el);
      }, this);
    },

    deleteBlock: function(event) {
      event.preventDefault();

      if (confirm(window.polyglot.t('app.confirmdeleteblock'))) {
        if (this.model.destroy()) {
          this.remove();
        }
      }
    },

    loadPageEdit: function (event) {
      event.preventDefault();
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

  }, {
    template: 'editorBlock'
  });

  return EditorBlockView;

});
