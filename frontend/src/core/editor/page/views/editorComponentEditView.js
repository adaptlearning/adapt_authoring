define(function(require) {

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('editorGlobal/views/editorOriginView');
  var JsonEditor = require('core/libraries/jquery.jsoneditor.min');

  var EditorComponentEditView = EditorOriginView.extend({

    tagName: "div",

    className: "project",

    events: {
      'click .editing-overlay-panel-title': 'toggleContentPanel'
    },

    preRender: function() {
      this.listenTo(Origin, 'editorComponentEditSidebar:views:save', this.saveComponent);
      this.model.set('ancestors', this.model.getPossibleAncestors().toJSON());
    },

    toggleContentPanel: function(event) {
      event.preventDefault();
      if (!$(event.currentTarget).hasClass('active')) { 
        this.$('.editing-overlay-panel-title').removeClass('active');
        $(event.currentTarget).addClass('active')
        this.$('.editing-overlay-panel-content').slideUp();
        $(event.currentTarget).siblings('.editing-overlay-panel-content').slideDown();
      }
    },

    postRender: function() {
      // Default properties for any JSON editors on this page
      var jsonEditorDefaults = {
        no_additional_properties: true, 
        disable_array_reorder: true,
        disable_collapse: true,
        disable_edit_json: true,
        disable_properties: true
      };

      // Get the component schema
      var thisComponentTypeId = this.model.get('_componentType')._id; 
      var componentType = _.find(Origin.editor.data.componentTypes.models, function(type){
        return type.get('_id') == thisComponentTypeId; 
      });

      var componentSchema =  {
        "type": "object",
        "properties": componentType.get('properties')
      };

      // Instantiate the JSON editor, appending any properties
      this.$('.component-properties').jsoneditor(_.extend({schema: componentSchema, startval: this.model.get('properties')}, jsonEditorDefaults));

      this.renderExtensionEditor('component');
      this.setViewToReady();
    },

    cancel: function (event) {
      event.preventDefault();
      Origin.trigger('editorSidebarView:removeEditView', this.model);
    },

    saveComponent: function() {
      var propertiesJson = this.$('.component-properties').jsoneditor('value');
      var extensionJson = {};

      extensionJson = this.getExtensionJson('component');

      var model = this.model;

      model.save({
        _componentType: model.attributes._componentType._id, // TODO -- Not sure about the schema here
        title: this.$('.setting-title').val(),
        displayTitle: this.$('.setting-displaytitle').val(),
        _classes: this.$('.setting-class').val(),
        body: tinyMCE.get('setting-body').getContent(),
        properties: propertiesJson,
        _extensions: extensionJson},
        {
          error: function() {
            alert('An error occurred doing the save');
          },
          success: _.bind(function() {
            
            Origin.trigger('editingOverlay:views:hide');

            Origin.trigger('editor:refreshData', function() {
              var currentPageId = this.model.getParent().getParent().getParent().get('_id');
              var currentCourseId = Origin.editor.data.course.get('_id');
              Backbone.history.navigate('#/editor/' + currentCourseId + '/page/' + currentPageId);
              this.remove();
            }, this);
            
          }, this)
        }
      );
    }
  },
  {
    template: 'editorComponentEdit'
  });

  return EditorComponentEditView;

});
