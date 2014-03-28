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

      // Add a componentTypes property to the model and call toJSON() on the
      // collection so that the templates work
      this.model.set('componentTypes', Origin.editor.componentTypes.toJSON());
    },

    postRender: function() {
      this.addComponentViews();
    },

    addComponentViews: function() {
      this.$('.page-article-components').empty();

      this.model.getChildren().each(function(component) {
        this.$('.page-article-components').append(new EditorComponentView({model: component}).$el);
      }, this);
    },

    deleteBlock: function(event) {
      event.preventDefault();

      if (confirm('Are you sure you want to delete this block?')) {
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

      var selectedComponentType = $('.add-component-form-componentType').val();
      var componentType = _.find(Origin.editor.componentTypes.models, function(type){
        return type.get('name') == selectedComponentType; 
      });

      var thisView = this;
      var newComponentModel = new EditorComponentModel();

      newComponentModel.save({
        title: '{Your new component}',
        body: '{Edit this text...}',
        _parentId: thisView.model.get('_id'),
        _courseId: Origin.editor.data.course.get('_id'),
        _type: 'component',
        _componentType: componentType.get('_id'),
        _component: 'slidingPuzzle',
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
