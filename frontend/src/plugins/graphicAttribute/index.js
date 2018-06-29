define(function(require) {
  var AssetModel = require('../../modules/assetManagement/models/assetModel');
  var Origin = require('core/origin');

  Origin.on('modal:assetSelected', function(asset) {
    var assetId = asset.assetId;
    var am = new AssetModel({ _id: assetId });
    Origin.once('modal:closed', function() {
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
      $('.field-attribution input').val(output);
    }

    function onAssetFetchError() {
      console.log('error', arguments);
    }
  });
});