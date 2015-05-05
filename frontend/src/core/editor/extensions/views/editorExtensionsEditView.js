// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
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

        // Set collections on model render for render
        this.model.set('enabledExtensions', enabledExtensionsCollection.toJSON());
        this.model.set('availableExtensions', disabledExtensionsCollection.toJSON());

        this.render();

        _.defer(_.bind(this.postRender, this));

    },

    postRender: function() {
        this.setViewToReady();
    },

    onAddExtensionClicked: function(event) {
        this.currentSelectedIds = [$(event.currentTarget).attr('data-id')];
        var extensionName = $(event.currentTarget).attr('data-displayname');

        var props = {
            _type: 'prompt',
            _showIcon: true,
            title: window.polyglot.t('app.manageextensions'),
            body: window.polyglot.t('app.confirmapplyextension', {extension: extensionName}),
            _prompts: [{
                    _callbackEvent: 'editorExtensionsEdit:views:add', 
                    promptText: window.polyglot.t('app.ok')
                }, {
                    _callbackEvent:'', 
                    promptText: window.polyglot.t('app.cancel')
                }
            ]
        };

        // alert
        //Origin.trigger('notify:prompt', props);
    },

    addExtension: function() {
        $.post('/api/extension/enable/' + this.model.get('_id'), {
                extensions: this.currentSelectedIds 
            }, _.bind(function(result) {
            if (result.success) {
                Origin.trigger('scaffold:updateSchemas', function() {
                    Origin.trigger('editor:refreshData', function() {
                        this.setupExtensions();
                    }, this);
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
            body: window.polyglot.t('app.confirmdeleteextension'),
            _prompts: [{
                    _callbackEvent: 'editorExtensionsEdit:views:remove', 
                    promptText: window.polyglot.t('app.ok')
                }, {
                    _callbackEvent:'', 
                    promptText: window.polyglot.t('app.cancel')
                }
            ]
        };

        // alert
        //Origin.trigger('notify:prompt', props);
    },

    removeExtension: function() {
        $.post('/api/extension/disable/' + this.model.get('_id'), {
                extensions: this.currentSelectedIds 
            }, _.bind(function(result) {
            if (result.success) {
                // Refresh the schemas
                Origin.trigger('scaffold:updateSchemas', function() {
                    Origin.trigger('editor:refreshData', function() {
                        this.setupExtensions();
                    }, this);
                }, this);
            } else {
                alert('An error occured');
            }          
        }, this));
    }

  },
  {
    template: 'editorExtensionsEdit'
  });

  return EditorExtensionsEditView;

});
