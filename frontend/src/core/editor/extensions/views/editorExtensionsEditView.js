// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('editorGlobal/views/editorOriginView');
  var EditorConfigModel = require('editorConfig/models/editorConfigModel');

  var EditorExtensionsEditView = EditorOriginView.extend({

    tagName: "div",

    className: "extension-management",

    settings: {
      autoRender: false
    },

    events: {
      'click button.remove-extension' : 'onRemoveExtensionClicked',
      'click button.add-extension'    : 'onAddExtensionClicked'
    },

    preRender: function() {
        this.currentSelectedIds = [];
        this.listenTo(Origin, 'editorExtensionsEdit:views:add', this.addExtension);
        this.listenTo(Origin, 'editorExtensionsEdit:views:remove', this.removeExtension);
        this.setupExtensions();
    },

    setupExtensions: function() {

        // Grab all available extensions
        var availableExtensionsCollection = Origin.editor.data.extensionTypes;

        // Get the extensions on the current course
        var enabledExtensions = Origin.editor.data.config.get('_enabledExtensions');

        // Pluck on extension name
        var enabledExtensionNames = _.pluck(enabledExtensions, 'name');
        
        var enabledExtensionsCollection = new Backbone.Collection();
        var disabledExtensionsCollection = new Backbone.Collection();

        // Go through each collection and see if it's enabled
        // and push to correct collection
        availableExtensionsCollection.each(function(extension) {
            if (_.indexOf(enabledExtensionNames, extension.get('name')) > -1) {
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

        Origin.Notify.confirm({
          title: window.polyglot.t('app.manageextensions'),
          text: window.polyglot.t('app.confirmapplyextension', {extension: extensionName}),
          html: true,
          callback: _.bind(this.onAddExtensionConfirmed, this)
        });
    },

    onAddExtensionConfirmed: function(confirmed) {
        if (confirmed) {
          Origin.trigger('editorExtensionsEdit:views:add');
        }
    },

    addExtension: function() {
        var self = this;
        $.post('/api/extension/enable/' + this.model.get('_id'), {
                extensions: this.currentSelectedIds
            }, _.bind(function(result) {
            if (result.success) {
                self.refreshData();
            } else {
                Origin.Notify.alert({
                  type: 'error',
                  text: window.polyglot.t('app.errorgeneric')
                });
            }
        }, this));
    },

    onRemoveExtensionClicked: function(event) {
        this.currentSelectedIds = [$(event.currentTarget).attr('data-id')];

        Origin.Notify.confirm({
          type: 'warning',
          title: window.polyglot.t('app.deleteextension'),
          text: window.polyglot.t('app.confirmdeleteextension'),
          callback: _.bind(this.onRemoveExtensionConfirmed, this)
        });

    },

    onRemoveExtensionConfirmed: function(confirmed) {
        if (confirmed) {
            Origin.trigger('editorExtensionsEdit:views:remove');
        }
    },

    refreshData: function() {
      var self = this;

      var configModel = new EditorConfigModel({_courseId: this.model.get('_id')});
      // Ensure that the latest config model is always up-to-date when entering this screen
      configModel.fetch({
        success: function(model, response, options) {
          Origin.editor.data.config =  model;

          Origin.trigger('scaffold:updateSchemas', function() {
            self.setupExtensions();
          }, this);
        }
      });
    },

    removeExtension: function() {
        var self = this;

        $.post('/api/extension/disable/' + this.model.get('_id'), {
                extensions: this.currentSelectedIds
            }, _.bind(function(result) {
            if (result.success) {
                self.refreshData();
            } else {
                Origin.Notify.alert({
                  type: 'error',
                  text: window.polyglot.t('app.errorgeneric')
                });
            }
        }, this));
    }

  },
  {
    template: 'editorExtensionsEdit'
  });

  return EditorExtensionsEditView;

});
