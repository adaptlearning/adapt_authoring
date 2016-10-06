// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Backbone = require('backbone');
  var OriginView = require('coreJS/app/views/originView');
  var Origin = require('coreJS/app/origin');

  var AssetManagementPreviewView = OriginView.extend({
    tagName: 'div',
    className: 'asset-management-preview',

    events: {
      'click button.close' : 'onCloseClicked',
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
      Origin.trigger('modal:passThrough', {
        eventToTrigger: 'assetModal:assetSelected',
        model: this.model
      });
    },

    onEditButtonClicked: function(event) {
      event.preventDefault();
      var assetId = this.model.get('_id');
      Origin.router.navigate('#/assetManagement/' + assetId + '/edit', { trigger: true });
    },

    onDeleteButtonClicked: function(event) {
      event.preventDefault();

      Origin.Notify.confirm({
        type: 'warning',
        text: window.polyglot.t('app.assetconfirmdelete'),
        callback: _.bind(this.onDeleteConfirmed, this)
      });
    },

    onDeleteConfirmed: function(confirmed) {
      if (confirmed) {
        this.model.destroy();
        Origin.trigger('assetManagement:assetPreviewView:delete');
        this.remove();
      }
    },

    onRestoreButtonClicked: function(event) {
      event && event.preventDefault();
      Origin.Notify.confirm({
        text: window.polyglot.t('app.assetconfirmrestore'),
        callback: _.bind(this.onRestoreConfirmed, this)
      });
    },

    onRestoreConfirmed: function(confirmed) {
      var self = this;
      if (confirmed) {
        $.ajax({
          url: '/api/asset/restore/' + self.model.get('_id'),
          type: 'PUT',
          success: function() {
            self.model.set({_isDeleted: false});
            Origin.trigger('assetManagement:assetPreviewView:delete');
            self.remove();
          },
          error: function(data) {
            Origin.Notify.alert({
              type: 'error',
              text: window.polyglot.t('app.errorrestoreasset', { message: data.message })
            });
          }
        });
      }
    },

    onCloseClicked: function() {
      Origin.trigger('assetManagement:assetPreviewView:delete');
    }
  }, {
    template: 'assetManagementPreview'
  });

  return AssetManagementPreviewView;
});
