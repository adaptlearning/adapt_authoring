// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('core/app/origin');

  var EditorOriginView = require('../../global/views/editorOriginView');
  var EditorConfigModel = require('../../config/models/editorConfigModel');

  var EditorExtensionsEditView = EditorOriginView.extend({
    className: "extension-management",
    tagName: "div",

    settings: {
      autoRender: false
    },

    events: {
      'click button.remove-extension': 'onRemoveExtensionClicked',
      'click button.add-extension': 'onAddExtensionClicked'
    },

    preRender: function() {
      this.currentSelectedIds = [];
      this.listenTo(Origin, 'editorExtensionsEdit:views:add', this.addExtension);
      this.listenTo(Origin, 'editorExtensionsEdit:views:remove', this.removeExtension);
      this.setupExtensions();
      this.render();
      // TODO is defer a good idea?
      _.defer(_.bind(this.postRender, this));
    },

    setupExtensions: function() {
      var availableExtensionsCollection = Origin.editor.data.extensionTypes;
      var enabledExtensionsCollection = new Backbone.Collection(null, { comparator: 'displayName' });
      var disabledExtensionsCollection = new Backbone.Collection(null, { comparator: 'displayName' });
      var enabledExtensionNames = _.pluck(Origin.editor.data.config.get('_enabledExtensions'), 'name');
      // sort into appropriate collection
      availableExtensionsCollection.each(function(extension) {
        if(_.indexOf(enabledExtensionNames, extension.get('name')) > -1) {
          enabledExtensionsCollection.add(extension);
        } else if(extension.get('_isAvailableInEditor')) {
          disabledExtensionsCollection.add(extension);
        }
      });
      this.model.set({
        enabledExtensions: enabledExtensionsCollection.toJSON(),
        availableExtensions: disabledExtensionsCollection.toJSON()
      });
    },

    postRender: function() {
      this.setViewToReady();
    },

    postData: function(url) {
      $.post(url + this.model.get('_id'), { extensions: this.currentSelectedIds }, _.bind(function(result) {
        if(!result.success) {
          return Origin.Notify.alert({ type: 'error', text: window.polyglot.t('app.errorgeneric') });
        }
        this.refreshData();
      }, this));
    },

    refreshData: function() {
      // ensure that the config model is up-to-date when entering this screen
      (new EditorConfigModel({ _courseId: this.model.get('_id') })).fetch({
        success: _.bind(function(model, response, options) {
          Origin.editor.data.config =  model;
          Origin.trigger('scaffold:updateSchemas', this.setupExtensions, this);
        }, this)
      });
    },

    addExtension: function() {
      this.postData('/api/extension/enable/');
    },

    removeExtension: function() {
      this.postData('/api/extension/disable/');
    },

    /**
    * Event handling
    */

    onAddExtensionClicked: function(event) {
      this.currentSelectedIds = [$(event.currentTarget).attr('data-id')];
      var extensionName = $(event.currentTarget).attr('data-displayname');

      Origin.Notify.confirm({
        title: window.polyglot.t('app.manageextensions'),
        text: window.polyglot.t('app.confirmapplyextension', { extension: extensionName }),
        html: true,
        callback: _.bind(this.onAddExtensionConfirmed, this)
      });
    },

    onAddExtensionConfirmed: function(confirmed) {
      if(confirmed) Origin.trigger('editorExtensionsEdit:views:add');
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
      if(confirmed) Origin.trigger('editorExtensionsEdit:views:remove');
    }
  }, {
    template: 'editorExtensionsEdit'
  });

  return EditorExtensionsEditView;
});
