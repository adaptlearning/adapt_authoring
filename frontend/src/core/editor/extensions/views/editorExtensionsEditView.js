define(function(require) {

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('editorGlobal/views/editorOriginView');

  var EditorExtensionsEditView = EditorOriginView.extend({
//
    tagName: "div",

    className: "project",

    events: {
      // 'click .editing-overlay-panel-title': 'toggleContentPanel'
    },

    preRender: function() {
      // this.listenTo(Origin, 'editorComponentEditSidebar:views:save', this.saveComponent);
      // this.model.set('ancestors', this.model.getPossibleAncestors().toJSON());
    },

    toggleContentPanel: function(event) {
      
    },

    postRender: function() {
      // Get the schema
      // var thisComponentTypeId = this.model.get('_componentType')._id; 
      // var componentType = _.find(Origin.editor.componentTypes.models, function(type){
      //   return type.get('_id') == thisComponentTypeId; 
      // });

      // var schema =  {
      //   "type": "object",
      //   "properties": componentType.get('properties')
      // };

      // this.$('.component-properties').jsoneditor({
      //   no_additional_properties: true, 
      //   disable_array_reorder: true,
      //   disable_collapse: true,
      //   disable_edit_json: true,
      //   disable_properties: true,
      //   form_name_root: 'briantest',
      //   schema: schema,
      //   startval: this.model.get('properties') 
      // });
    },

    cancel: function (event) {
      // event.preventDefault();
      // Origin.trigger('editorSidebarView:removeEditView', this.model);
    }

  },
  {
    template: 'editorExtensionsEdit'
  });

  return EditorExtensionsEditView;

});
