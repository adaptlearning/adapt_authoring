define(function(require) {

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('coreJS/editor/views/editorOriginView');

  var editor;
  var EditorComponentEditView = EditorOriginView.extend({

    tagName: "div",

    className: "project",

    events: {
      'click .save-button'   : 'saveComponent',
      'click .cancel-button' : 'cancel'
    },

    preRender: function() {
      this.listenTo(Origin, 'editorSidebarView:removeEditView', this.remove);
      this.listenTo(Origin, 'editorView:removeSubViews', this.remove);
      this.model.set('ancestors', this.model.getPossibleAncestors().toJSON());
    },

    postRender: function() {
      // Get the schema
      var thisComponentType = this.model.get('_componentType'); 
      var componentType = _.find(Origin.editor.componentTypes.models, function(type){
        return type.get('_id') == thisComponentType; 
      });

      var schema =  {
        "type": "object",
        "properties": componentType.get('properties')
      };

      editor = new JSONEditor(document.getElementById('component-properties'), 
        {no_additional_properties: true, 
          no_additional_properties: true,
          schema: schema,
          startval: this.model.get('properties')       
        });
    },

    cancel: function (event) {
      event.preventDefault();
      Origin.trigger('editorSidebarView:removeEditView', this.model);
    },

    saveComponent: function(event) {
      event.preventDefault();

      var propertiesJson = editor.getValue();

      var model = this.model;

      model.save({
        _parentId: this.$('.component-parent').find(':selected').val(),
        title: this.$('.component-title').val(),
        body: this.$('.component-body').val(),
        properties: propertiesJson},
        {
          error: function() {
            alert('An error occurred doing the save');
          },
          success: function() {
            Origin.trigger('editorView:fetchData');
          }
        }
      );
    }
  },
  {
    template: 'editorComponentEdit'
  });

  return EditorComponentEditView;

});
