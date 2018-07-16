// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('core/origin');
  var EditorOriginView = require('../../global/views/editorOriginView');
  var ExtensionModel = require('core/models/extensionModel');
  var EditorCollection = require('../../global/collections/editorCollection');

  var EditorExtensionsEditView = EditorOriginView.extend({
    className: "extension-management",
    tagName: "div",
    // TODO do we need to turn this off?
    settings: {
      autoRender: false
    },

    events: {
      'click button.remove-extension': 'onRemoveExtensionClicked',
      'click button.add-extension': 'onAddExtensionClicked'
    },

    preRender: function() {
      var _this = this;
      this.currentSelectedIds = [];

      this.listenTo(Origin, {
        'editorExtensionsEdit:views:add': this.addExtension,
        'editorExtensionsEdit:views:remove': this.removeExtension
      });
      // assumption: extensions are always switched between enabled and available
      this.listenTo(this.model, 'change:enabledExtensions', this.render);

      this.setupExtensions(function() {
        _this.postRender()
      });
    },

    setupExtensions: function(callback) {
      var enabledExtensionNames = _.pluck(Origin.editor.data.config.get('_enabledExtensions'), 'name');
      var enabledExtensions = [];
      var disabledExtensions = [];
      var _this = this;

      var extensionTypes = new EditorCollection(null, {
        autoFetch: false,
        model: ExtensionModel,
        url: ExtensionModel.prototype.urlRoot,
        _type: 'extension'
      });

      extensionTypes.fetch({
        success: function() {
          extensionTypes.each(function(model) {
            var extension = model.toJSON();
            if (_.indexOf(enabledExtensionNames, extension.name) > -1) {
              enabledExtensions.push(extension);
            } else if (extension._isAvailableInEditor) {
              disabledExtensions.push(extension);
            }
          });

          enabledExtensions.sort(function(a, b){
            if(a.displayName < b.displayName) return -1;
            if(a.displayName > b.displayName) return 1;
            return 0;
          });

          disabledExtensions.sort(function(a, b){
            if(a.displayName < b.displayName) return -1;
            if(a.displayName > b.displayName) return 1;
            return 0;
          });

          _this.model.set({
            enabledExtensions: enabledExtensions,
            availableExtensions: disabledExtensions
          });

          if(callback){
            return callback();
          }
        },
        error: function(err) {
          if(callback){
            return callback(err);
          }
        }
      })
    },

    postRender: function() {
      this.setViewToReady();
    },

    postData: function(url) {
      $.post(url + this.model.get('_id'), { extensions: this.currentSelectedIds }, _.bind(function(result) {
        if(!result.success) {
          return Origin.Notify.alert({ type: 'error', text: Origin.l10n.t('app.errorgeneric') });
        }
        this.refreshData();
      }, this));
    },

    refreshData: function() {
      // ensure that the config model is up-to-date when entering this screen
      if(!Origin.editor.data.config) {
        return console.log('Missing the config model');
      }
      Origin.editor.data.config.fetch({
        success: _.bind(function(model, response, options) {
          if(!response._enabledExtensions) {
            // backbone won't do this for us...
            model.unset('_enabledExtensions');
          }
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
      Origin.trigger('editorExtensionsEdit:views:add');
    },

    onRemoveExtensionClicked: function(event) {
      this.currentSelectedIds = [$(event.currentTarget).attr('data-id')];

      Origin.Notify.confirm({
        type: 'warning',
        title: Origin.l10n.t('app.deleteextension'),
        text: Origin.l10n.t('app.confirmdeleteextension'),
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
