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
      var componentType = _.find(Origin.editor.componentTypes.models, function(type){
        return type.get('_id') == thisComponentTypeId; 
      });

      var componentSchema =  {
        "type": "object",
        "properties": componentType.get('properties')
      };

      // Instantiate the JSON editor, appending any properties
      this.$('.component-properties').jsoneditor(_.extend({schema: componentSchema, startval: this.model.get('properties')}, jsonEditorDefaults));

      // Now check any course extensions with properties at the component level
      var componentExtensions = this.model.get('_extensions');

      if (componentExtensions) {
        // Check which extensions are enabled on this course
        var courseExtensions = Origin.editor.data.config.get('_enabledExtensions'),
          extensionKeys = _.keys(componentExtensions),
          enabledExtensions = _.keys(courseExtensions),
          i = 1;

        _.each(enabledExtensions, function(extension) {
          var enabledExtension = Origin.editor.extensionTypes.findWhere({extension: extension});

          // Check if the property extension properties at the component level
          if (enabledExtension && enabledExtension.get('properties').pluginLocations.properties.component.properties) {
            jsonEditorDefaults.schema = enabledExtension.get('properties').pluginLocations.properties.component;

            // Re-construct the 'startval' value with targetAttribute as the root property
            if (_.indexOf(extensionKeys, enabledExtension.get('targetAttribute')) > -1) {
              var value = {};

              value[enabledExtension.get('targetAttribute')] = this.model.get('_extensions')[enabledExtension.get('targetAttribute')]
              
              jsonEditorDefaults.startval = value; 
            }

            // Dynamically create a container <div>
            this.$('.component-extensions').append("<div class='component-extension-item-" + i + "'></div>");
            
            // Add a JSON editor for every enabled extension at the component level
            this.$('.component-extension-item-' + i).jsoneditor(jsonEditorDefaults);
          }
        }, this);
      }
    },

    cancel: function (event) {
      event.preventDefault();
      Origin.trigger('editorSidebarView:removeEditView', this.model);
    },

    saveComponent: function() {
      var propertiesJson = this.$('.component-properties').jsoneditor('value');
      var extensionContainers = this.$('div.component-extensions > div');
      var extensionJson = {};

      // Iterate over any extensions
      for (var i = 0; i < extensionContainers.length; i++) {
        // For some reason the jsoneditor object is very fussy with how it's referenced
        extensionJson = _.extend(this.$('.' + extensionContainers[i].className).jsoneditor('value'), extensionJson);
      }

      var model = this.model;

      model.save({
        _parentId: this.$('.component-parent').find(':selected').val(),
        _componentType: model.attributes._componentType._id, // TODO -- Not sure about the schema here
        title: this.$('.setting-title').val(),
        displayTitle: this.$('.setting-displaytitle').val(),
        body: tinyMCE.get('setting-body').getContent(),
        properties: propertiesJson,
        _extensions: extensionJson},
        {
          error: function() {
            alert('An error occurred doing the save');
          },
          success: _.bind(function() {
            Origin.trigger('editingOverlay:views:hide');
            Origin.trigger('editorView:fetchData');
            Backbone.history.history.back();
            this.remove();
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
