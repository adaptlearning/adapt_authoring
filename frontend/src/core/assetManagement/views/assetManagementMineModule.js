// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('coreJS/app/origin');
  var AssetManagementRefineModule = require('coreJS/assetManagement/views/assetManagementRefineModule');

  var AssetManagementMineModule = AssetManagementRefineModule.extend({
    className: 'module mine',

    events: {
      'click input': 'onInputClicked'
    },

    onInputClicked: function(e) {
      if(e.currentTarget.checked === true) {
        this.apply('search', {
          createdBy: { $in:[ Origin.sessionModel.attributes.id ] }
        });
      } else {
        this.apply('search', {});
      }
    }
  }, {
    template: 'assetManagementMineModule'
  });

  return AssetManagementMineModule;
});
