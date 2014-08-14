define(function(require) {

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('editorGlobal/views/editorOriginView');
  var ExtensionCollection = require('editorExtensions/collections/extensionCollection');
  var ExtensionModel = require('editorExtensions/models/extensionModel');

  var EditorExtensionsEditView = EditorOriginView.extend({

    tagName: "div",

    className: "extension-management",

    settings: {
      autoRender: false
    },

    events: {
      'click button.remove-extension' : 'onRemoveExtensionClicked',
      'click button.add-extension': 'onAddExtensionClicked'
    },

    preRender: function() {
        this.currentSelectedIds = [];
        this.listenTo(Origin, 'editorExtensionsEdit:views:add', this.addExtension);
        this.listenTo(Origin, 'editorExtensionsEdit:views:remove', this.removeExtension);
        this.setupExtensions();
    },

    setupExtensions: function() {

        // Grab available extensions
        var availableExtensionsCollection = Origin.editor.data.extensionTypes;

        // Get enabled extensions
        var enabledExtensions = Origin.editor.data.config.get('_enabledExtensions');

        // Pluck Ids so we can compare
        var enabledExtensionsIds = _.pluck(enabledExtensions, '_id');

        var enabledExtensionsCollection = new Backbone.Collection();
        var disabledExtensionsCollection = new Backbone.Collection();

        // Go through each collection and see if it's enabled 
        // and push to correct collection
        availableExtensionsCollection.each(function(extension) {

            if (_.indexOf(enabledExtensionsIds, extension.get('_id')) > -1) {
                enabledExtensionsCollection.add(extension);
            } else {
                disabledExtensionsCollection.add(extension);
            }
        });

        console.log(availableExtensionsCollection, Origin.editor.data.config, enabledExtensionsCollection, disabledExtensionsCollection);

        // Set collections on model render for render
        this.model.set('enabledExtensions', enabledExtensionsCollection.toJSON());
        this.model.set('availableExtensions', disabledExtensionsCollection.toJSON());

        this.render();

    },

    onAddExtensionClicked: function(event) {
        this.currentSelectedIds = [$(event.currentTarget).attr('data-id')];
        var props = {
            _type: 'prompt',
            _showIcon: true,
            title: window.polyglot.t('app.manageextensions'),
            body: window.polyglot.t('app.confirmapplyextensions'),
            _prompts: [{
                    _callbackEvent: 'editorExtensionsEdit:views:add', 
                    promptText: window.polyglot.t('app.ok')
                }, {
                    _callbackEvent:'', 
                    promptText: window.polyglot.t('app.cancel')
                }
            ]
        };

        Origin.trigger('notify:prompt', props);
    },

    addExtension: function() {
        $.post('/api/extension/enable/' + this.model.get('_id'), {
                extensions: this.currentSelectedIds 
            }, _.bind(function(result) {
            if (result.success) {

                Origin.trigger('editor:refreshData', function() {
                    this.setupExtensions();
                }, this);

            } else {
                alert('An error occured');
            }          
        }, this));
    },

    onRemoveExtensionClicked: function(event) {
        this.currentSelectedIds = [$(event.currentTarget).attr('data-id')];
        var props = {
            _type: 'prompt',
            _showIcon: true,
            title: window.polyglot.t('app.manageextensions'),
            body: window.polyglot.t('app.confirmapplyextensions'),
            _prompts: [{
                    _callbackEvent: 'editorExtensionsEdit:views:remove', 
                    promptText: window.polyglot.t('app.ok')
                }, {
                    _callbackEvent:'', 
                    promptText: window.polyglot.t('app.cancel')
                }
            ]
        };

        Origin.trigger('notify:prompt', props);
    },

    removeExtension: function() {
        $.post('/api/extension/disable/' + this.model.get('_id'), {
                extensions: this.currentSelectedIds 
            }, _.bind(function(result) {
            if (result.success) {

                Origin.trigger('editor:refreshData', function() {
                    this.setupExtensions();
                }, this);

            } else {
                alert('An error occured');
            }          
        }, this));
    }

    /**
     * Trigger a prompt for the user to confirm deletion of an extension 
     */
    /*confirmDeleteExtension: function(event) {
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
    },*/

    /**
     * Remove the extension from the course
     **/
    /*deleteExtension: function(event) {
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
    },*/

    /**
     * Trigger a prompt (if appropriate) for the user to confirm they want to save any extensions
     */
    /*confirmSave: function() {

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
    },*/

    /**
     * Make the API call to save extensions
     */
    /*saveExtensions: function() {
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
    }*/

  },
  {
    template: 'editorExtensionsEdit'
  });

  return EditorExtensionsEditView;

});
