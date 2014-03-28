define(function(require) {

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('coreJS/editor/views/editorOriginView');
  var JsonEditor = require('core/libraries/jquery.jsoneditor.min');

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
      this.$('.component-properties').jsoneditor({
        startval: this.model.get('properties'),
        no_additional_properties: true,
        schema: {
          "title": "adapt-contrib-graphic",
          "type": "object",
          "id": "adapt-contrib-graphic",
          "required": true,
          "properties": {
            "graphic": {
              "title": "graphic",
              "type": "object",
              "id": "graphic",
              "properties": {
                "alt": {
                  "type": "string"
                },
                "title": {
                  "type": "string"
                },
                "large": {
                  "type": "string"
                },
                "medium": {
                  "type": "string"
                },
                "small": {
                  "type": "string"
                }
              }
            }
          }
        }
      });
    },

    cancel: function (event) {
      event.preventDefault();
      Origin.trigger('editorSidebarView:removeEditView', this.model);
    },

    saveComponent: function(event) {
      event.preventDefault();

      var propertiesJson = this.$('.component-properties').jsoneditor('value');

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
