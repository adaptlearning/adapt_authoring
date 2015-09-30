// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){

  var Backbone = require('backbone');
  var OriginView = require('coreJS/app/views/originView');
  var Origin = require('coreJS/app/origin');

  var AssetManagementPreviewView = OriginView.extend({

    tagName: 'div',

    className: 'asset-management-preview',

    events: {
      'click a.confirm-select-asset' : 'selectAsset',
      'click .asset-preview-edit-button': 'onEditButtonClicked',
      'click .asset-preview-delete-button': 'onDeleteButtonClicked',
      'click .asset-preview-restore-button': 'onRestoreButtonClicked'
    },

    preRender: function() {
      this.listenTo(this, 'remove', this.remove);
    },

    postRender: function () {
      if (this.$('audio, video').length) {
        // Add wmv formats to the accepted types
        mejs.plugins.silverlight[0].types.push('video/x-ms-wmv');
        mejs.plugins.silverlight[0].types.push('audio/x-ms-wma');
        var mediaElement = this.$('audio, video').mediaelementplayer({
          pluginPath:'adaptbuilder/css/assets/',
          features: ['playpause','progress','current','duration']
        });
      }
    },

    selectAsset: function (event) {
      event && event.preventDefault();

      var data = {eventToTrigger: 'assetModal:assetSelected', model: this.model};
      Origin.trigger('modal:passThrough', data);
    },

    onEditButtonClicked: function(event) {
      event.preventDefault();
      var assetId = this.model.get('_id');
      Backbone.history.navigate('#/assetManagement/' + assetId + '/edit', {trigger: true});
    },

    onDeleteButtonClicked: function(event) {
      event.preventDefault();
      var self = this;

      var shouldDeleteAsset = confirm(window.polyglot.t('app.assetconfirmdelete'));

      if (shouldDeleteAsset) {
        $.ajax({
          url: '/api/asset/trash/' + self.model.get('_id'),
          type: 'PUT',
          success: function() {
            if (Origin.permissions.hasPermissions(["*"])) {
              self.model.set({_isDeleted: true});
            } else {
              self.model.trigger('destroy', self.model, self.model.collection);
            }
            Origin.trigger('assetManagement:assetPreviewView:delete');
            self.remove();
          },
          error: function(data) {
            alert("Couldn't delete this asset", data.message);
          }
        });
      }
    },

    onRestoreButtonClicked: function(event) {
      event.preventDefault();
      var self = this;
      
      var shouldRestoreAsset = confirm(window.polyglot.t('app.assetconfirmrestore'));

      if (shouldRestoreAsset) {
        $.ajax({
          url: '/api/asset/restore/' + self.model.get('_id'),
          type: 'PUT',
          success: function() {
            self.model.set({_isDeleted: false});
            Origin.trigger('assetManagement:assetPreviewView:delete');
            self.remove();
          },
          error: function(data) {
            alert("Couldn't restore this asset", data.message);
          }
        });
      }
    }

  }, {
    template: 'assetManagementPreview'
  });

  return AssetManagementPreviewView;

});
