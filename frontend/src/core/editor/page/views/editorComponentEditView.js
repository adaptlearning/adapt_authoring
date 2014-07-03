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
      // Get the schema
      var thisComponentTypeId = this.model.get('_componentType')._id; 
      var componentType = _.find(Origin.editor.componentTypes.models, function(type){
        return type.get('_id') == thisComponentTypeId; 
      });

      var schema =  {
        "type": "object",
        "properties": componentType.get('properties')
      };

      this.$('.component-properties').jsoneditor({
        no_additional_properties: true, 
        disable_array_reorder: true,
        disable_collapse: true,
        disable_edit_json: true,
        disable_properties: true,
        schema: schema,
        startval: this.model.get('properties') 
      });

      // Global extensions
      // console.log(Origin.editor.extensionTypes);
      var componentExtensions = this.model.get('_extensions');

      if (componentExtensions) {
        // Check the _extensions array
        var courseExtensions = Origin.editor.data.config.get('_enabledExtensions'),
          i = 1;
          
        _.each(courseExtensions, function(extension) {
          var enabledExtension = Origin.editor.extensionTypes.findWhere({_id: extension._id});

          // Check if the property extension properties at the component level
          if (enabledExtension && enabledExtension.get('properties').pluginLocations.properties.component.properties) {
            this.$('.component-extensions').append("<div class='component-extension-item-" + i + "'></div>");
            // Add a JSON editor for every enabled extension at the component level
            this.$('.component-extension-item-' + i).jsoneditor({
              no_additional_properties: true, 
              disable_array_reorder: true,
              disable_collapse: true,
              disable_edit_json: true,
              disable_properties: true,
              schema: enabledExtension.get('properties').pluginLocations.properties.component
            });
          }
        });
      }
    },

    cancel: function (event) {
      event.preventDefault();
      Origin.trigger('editorSidebarView:removeEditView', this.model);
    },

    saveComponent: function() {

      var propertiesJson = this.$('.component-properties').jsoneditor('value');

      var model = this.model;

      model.save({
        _parentId: this.$('.component-parent').find(':selected').val(),
        _componentType: model.attributes._componentType._id, // TODO -- Not sure about the schema here
        title: this.$('.setting-title').val(),
        displayTitle: this.$('.setting-displaytitle').val(),
        body: tinyMCE.get('setting-body').getContent(),
        properties: propertiesJson},
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
