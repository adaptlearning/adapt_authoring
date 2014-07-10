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

      this.listenTo(this.allExtensionsCollection, 'sync', this.setupExtensions, this);

      this.listenTo(Origin, 'editorExtensionsEditSidebar:views:save', this.saveExtensions);
      this.listenTo(Origin, 'editorExtensionsEditSidebar:views:confirmSave', this.confirmSave);
      this.listenTo(Origin, 'editorExtensionsEditSidebar:views:delete', this.deleteExtension);
    },

    /**
     * Read the enabled extensions from the config and setup the 'enabled' and 'available' lists
     */
    setupExtensions: function() {
      var _this = this;

      // Read the enabled extensions from the config
      $.ajax({
          url: '/api/content/config/' + _this.model.get('_id')
        }).done(function(data) {
          
          var extensionsData = data._enabledExtensions,
            extensions = [];

          extensions = _.pluck(extensionsData, '_id');

          _this.model.set('extensionsToRemove', null);

          // Remove the enabled extensions from the list of available extensions
          var enabledExtensionsModels = _this.allExtensionsCollection.filter(function(extension) {
            return _.indexOf(extensions, extension.get('_id')) > -1;
          });

          var enabledExtensionsCollection = new Backbone.Collection(enabledExtensionsModels);
          _this.model.set('enabledExtensions', enabledExtensionsCollection);

          var availableExtensionsModels = _this.allExtensionsCollection.filter(function(extension) {
            return _.indexOf(extensions, extension.get('_id')) == -1;
          });

          var availableExtensionsCollection = new Backbone.Collection(availableExtensionsModels);

          _this.model.set('availableExtensions', availableExtensionsCollection);
          _this.model.set('enabledExtensions', _this.model.get('enabledExtensions').toJSON());
          _this.model.set('availableExtensions', _this.model.get('availableExtensions').toJSON());

          _this.render();
        });
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
          body: window.polyglot.t('app.confirmdeleteextension') + '<br />' + '<br />' + window.polyglot.t('app.confirmdeleteextensionwarning'),
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

      _this = this;

      $.post('/api/extension/disable/' + _this.model.get('_id'), 
        {
          extensions: _this.model.get('extensionsToRemove') 
        },
        function(result) {
          if (result.success) {
            // Re-render the extensions in the appropriate list
            _this.setupExtensions();      
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
        Origin.trigger('editingOverlay:views:hide');
        Backbone.history.history.back();
        this.remove();
      }
    },

    /**
     * Make the API call to save extensions
     */
    saveExtensions: function() {
      var _this = this;

      $.post('/api/extension/enable/' + _this.model.get('_id'), 
        {
          extensions: this.model.get('selectedExtensions') 
        },
        function(result) {
          if (result.success) {
              Origin.trigger('editingOverlay:views:hide');
              Origin.trigger('editorView:fetchData');
              Backbone.history.history.back();
              _this.remove();
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
