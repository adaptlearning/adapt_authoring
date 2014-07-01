define(function(require) {

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('editorGlobal/views/editorOriginView');
  var ExtensionCollection = require('editorExtensions/collections/extensionCollection');
  var ExtensionModel = require('editorExtensions/models/extensionModel');

  var EditorExtensionsEditView = EditorOriginView.extend({

    tagName: "div",

    className: "project",

    settings: {
      autoRender: false
    },

    events: {
      'click button.remove-extension' : 'confirmDeleteExtension'
    },

    preRender: function() {
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

    /**
     * Trigger a prompt for the user to confirm deletion of an extension 
     */
    confirmDeleteExtension: function(event) {
      var extensionId = event.currentTarget.value,
        extensions = [];

      extensions.push(extensionId);

      this.model.set('extensionsToRemove', extensions);

      var props = {
          _type: 'prompt',
          _showIcon: true,
          title: window.polyglot.t('app.manageextensions'),
          body: window.polyglot.t('app.confirmdeleteextension'),
          _prompts: [
            {_callbackEvent: 'editorExtensionsEditSidebar:views:delete', promptText: window.polyglot.t('app.ok')},
            {_callbackEvent: '', promptText: window.polyglot.t('app.cancel')}
          ]
        };

        Origin.trigger('notify:prompt', props);  
    },

    /**
     * Remove the extension from the course
     **/
    deleteExtension: function(event) {
      if (event) {
        event.preventDefault();
      }

      console.log('in deleteExtension');

      $.post('/api/extension/disable/' + this.model.get('_id'), 
        {
          extensions: this.model.get('extensionsToRemove') 
        },
        function(result) {
          if (result.success) {
            this.model.set('extensionsToRemove', null);
            Backbone.history.history.back();
            // Origin.trigger('editingOverlay:views:hide');  
          } else {
            alert('An error occured');
          }          
        }
      );
    },

    /**
     * Trigger a prompt (if appropriate) for the user to confirm they want to save any extensions
     */
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
      else {
        Backbone.history.history.back();
        Origin.trigger('editingOverlay:views:hide');
      }
    },

    /**
     * Make the API call to save extensions
     */
    saveExtensions: function() {
      $.post('/api/extension/enable/' + this.model.get('_id'), 
        {
          extensions: this.model.get('selectedExtensions') 
        },
        function(result) {
          if (result.success) {
            Backbone.history.history.back();
            Origin.trigger('editingOverlay:views:hide');  
          } else {
            alert('An error occured');
          }          
        }
      );
    }

  },
  {
    template: 'editorExtensionsEdit'
  });

  return EditorExtensionsEditView;

});
