// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Origin = require('coreJS/app/origin');
  var AssetManagementModalNewAssetView = require('coreJS/assetManagement/views/assetManagementModalNewAssetView');

  var ModalView = AssetManagementModalNewAssetView.extend({
    remove: function() {
      AssetManagementModalNewAssetView.prototype.remove.apply(this, arguments);
      // HACK need to wait for the animation to finish
      window.setTimeout(function() { Origin.trigger('modal:onCancel'); }, 300);
    },

    onFileUploadSuccess: function() {
      Origin.trigger('modal:onUpdate');
    },

    getData: function() {
      return {
        assetLink: 'course/assets/' + this.model.get('filename'),
        assetId: this.model.get('_id'),
        assetFilename: this.model.get('filename'),
        _shouldAutofill: false
      };
    }
  }, {
    template: 'assetManagementModalNewAsset'
  });

  return ModalView;
});
