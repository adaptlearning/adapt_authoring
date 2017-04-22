define(function(require) {
  var AssetModel = require('../../core/assetManagement/models/assetModel.js');
  var Origin = require('coreJS/app/origin');

  Origin.on('modal:assetSelected', function(asset) {
    var assetId = asset.assetId;
    Origin.on('modal:closed', function() {
      var am = new AssetModel({ _id: assetId });
      am.fetch({
        success: onAssetFetchSuccess,
        error: onAssetFetchError
      });
    });

    function onAssetFetchSuccess(model) {
      var attribution = model.get('attribution');
      var source = model.get('source');
      var licence = model.get('licence');
      output = "";
      if (source && attribution) {
        output = '<a href="'+source+'" target="_blank">' + attribution + '</a>';
      } else if (attribution) {
        output = attribution;
      }
      if (licence) {
        output += " <span class='assetLicence'>[" + licence + "]</span>";
      }
      $('.component-edit .field-graphic .field-attribution input').val(output);
    }

    function onAssetFetchError() {
      console.log('error', arguments);
    }
  });
});