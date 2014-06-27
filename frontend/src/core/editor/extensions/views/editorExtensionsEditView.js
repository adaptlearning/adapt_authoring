define(function(require) {

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('editorGlobal/views/editorOriginView');
  var ExtensionCollection = require('editorExtensions/collections/extensionCollection');
  var ExtensionModel = require('editorExtensions/models/extensionModel');

  var EditorExtensionsEditView = EditorOriginView.extend({
//
    tagName: "div",

    className: "project",

    settings: {
      autoRender: false
    },

    events: {
      'click button.remove-extension' : 'confirmDeleteExtension'
    },

    preRender: function() {
      this.model = new Backbone.Model();
      this.allExtensionsCollection = new ExtensionCollection();
      this.allExtensionsCollection.fetch();

      this.listenTo(this.allExtensionsCollection, 'reset add change remove', this.setupExtensions, this);

      this.listenTo(Origin, 'editorExtensionsEditSidebar:views:save', this.saveExtensions);
      this.listenTo(Origin, 'editorExtensionsEditSidebar:views:confirmSave', this.confirmSave);
      this.listenTo(Origin, 'editorExtensionsEditSidebar:views:delete', this.deleteExtension);
    },

    setupExtensions: function() {
      // console.log('in setupExtensions');
      // this.model.set('enabledExtensions', this.allExtensionsCollection.toJSON());
      this.model.set('enabledExtensions', this.allExtensionsCollection.toJSON());
      this.model.set('availableExtensions', this.allExtensionsCollection.toJSON());

      this.render();
    },

    confirmDeleteExtension: function(event) {
      var extensionId = event.currentTarget.value;

      var props = {
          _type: 'prompt',
          _showIcon: true,
          title: window.polyglot.t('app.manageextensions'),
          body: window.polyglot.t('app.confirmdeleteextension'),
          _prompts: [
            {_callbackEvent: 'editorExtensionsEditSidebar:views:removeConfirm:' + extensionId, promptText: window.polyglot.t('app.ok')},
            {_callbackEvent:'', promptText: window.polyglot.t('app.cancel')}
          ]
        };

        Origin.trigger('notify:prompt', props);  
    },

    deleteExtension: function(event) {

    },

    confirmSave: function() {

      var checkedItems = $('input[type="checkbox"]:checked'),
        selected = [],
        html = '';
      
      if (checkedItems.length !== 0) {

        html += '<ul>';

        for (var i = 0; i < checkedItems.length; i++) {
          html += '<li>' + checkedItems[i].dataset['name'] +  '</li>';
          selected.push(checkedItems[i].value);
        }

        html += '</ul>';

        this.model.set('selectedExtensions', selected);

        var props = {
          _type: 'prompt',
          _showIcon: true,
          title: window.polyglot.t('app.manageextensions'),
          body: window.polyglot.t('app.confirmapplyextensions') + html,
          _prompts: [
            {_callbackEvent: 'editorExtensionsEditSidebar:views:save', promptText: window.polyglot.t('app.ok')},
            {_callbackEvent:'', promptText: window.polyglot.t('app.cancel')}
          ]
        };

        Origin.trigger('notify:prompt', props);  
      }
    },

    saveExtensions: function() {
      alert("TODO - Apply extensions")
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
