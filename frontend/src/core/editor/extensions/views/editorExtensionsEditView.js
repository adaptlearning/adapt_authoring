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
      var availableExtensionsCollection = Origin.editor.data.extensionTypes;
      var enabledExtensionsCollection = new Backbone.Collection(null, { comparator: 'displayName' });
      var disabledExtensionsCollection = new Backbone.Collection(null, { comparator: 'displayName' });

      var enabledExtensionNames = _.pluck(Origin.editor.data.config.get('_enabledExtensions'), 'name');

      // sort into appropriate collection
      availableExtensionsCollection.each(function(extension) {
        if (_.indexOf(enabledExtensionNames, extension.get('name')) > -1) {
          enabledExtensionsCollection.add(extension);
        } else if(extension.get('_isAvailableInEditor')) {
          disabledExtensionsCollection.add(extension);
        }
      });

      // Set collections on model render for render
      this.model.set('enabledExtensions', enabledExtensionsCollection.toJSON());
      this.model.set('availableExtensions', disabledExtensionsCollection.toJSON());

      this.render();
      // TODO is defer a good idea?
      _.defer(_.bind(this.postRender, this));
    },

    postRender: function() {
      this.setViewToReady();
    },

    postData: function(url) {
      $.post(url + this.model.get('_id'), { extensions: this.currentSelectedIds }, _.bind(function(result) {
        if (result.success) {
          this.refreshData();
        } else {
          Origin.Notify.alert({
            type: 'error',
            text: window.polyglot.t('app.errorgeneric')
          });
        }
      }, this));
    },

    refreshData: function() {
      var configModel = new EditorConfigModel({ _courseId: this.model.get('_id') });
      // Ensure that the latest config model is always up-to-date when entering this screen
      configModel.fetch({
        success: _.bind(function(model, response, options) {
          Origin.editor.data.config =  model;
          Origin.trigger('scaffold:updateSchemas', function() {
            this.setupExtensions();
          }, this);
        }, this)
      });
    },

    onAddExtensionClicked: function(event) {
      this.currentSelectedIds = [$(event.currentTarget).attr('data-id')];

      Origin.trigger('editorExtensionsEdit:views:add');
    },

    addExtension: function() {
      this.postData('/api/extension/enable/');
    },

    removeExtension: function() {
      this.postData('/api/extension/disable/');
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
      if(confirmed) {
        Origin.trigger('editorExtensionsEdit:views:remove');
      }
    }
  },
  {
    template: 'editorExtensionsEdit'
  });

  return EditorExtensionsEditView;

});
