// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var _ = require('underscore');
  var Backbone = require('backbone');
  var OriginView = require('coreJS/app/views/originView');
  var Origin = require('coreJS/app/origin');
  var AssetManagementNewAssetView = require('coreJS/assetManagement/views/assetManagementNewAssetView');
  var AssetModel = require('coreJS/assetManagement/models/assetModel');
  var TagsInput = require('core/libraries/jquery.tagsinput.min');

  var ModalView = AssetManagementNewAssetView.extend({
    className: 'asset-management-modal-new-asset',

    events: {
      'change .asset-file': 'onFileSelected',
      'click a.workspaces': 'onWorkspacesClicked',

      'dragenter label[for=file]': 'onDrag',
      'dragover label[for=file]': 'onDrag',
      'dragleave label[for=file]': 'onDrop',
      'dragend label[for=file]': 'onDrop',
      'drop label[for=file]': 'onDrop',

      'click .asset-management-modal-new-asset-close': 'remove',
      'click .asset-management-modal-new-asset-upload': 'uploadData'
    },

    preRender: function() {
      AssetManagementNewAssetView.prototype.preRender.apply(this, arguments);
      this.listenTo(Origin, 'assetManagement:modal:newAssetOpened', this.remove);
    },

    postRender: function() {
      AssetManagementNewAssetView.prototype.postRender.apply(this, arguments);
      this.$('form').submit(false);
      this.$el.addClass('show');
    },

    setHeight: function () {
    },

    remove: function() {
      this.$el.removeClass('show');
      // HACK need to wait for the animation to finish
      window.setTimeout(_.bind(function() {
        AssetManagementNewAssetView.prototype.remove.apply(this, arguments);
      }, this), 300);
    },

    onNewAssetSaveSuccess: function() {
      Origin.trigger('assetManagement:collection:refresh', true);
      this.remove();
    },

    onFileUploadSuccess: function(data, status, xhr) {
      Origin.once('assetManagement:assetManagementCollection:fetched', function() {
        Origin.trigger('assetManagement:modal:selectItem', data._id);
      })
      Origin.trigger('assetManagement:collection:refresh', true);
      this.remove();
    }
  }, {
    template: 'assetManagementModalNewAsset'
  });

  return ModalView;
});
