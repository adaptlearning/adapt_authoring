// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('coreJS/app/origin');
  var AssetManagementRefineModule = require('coreJS/assetManagement/views/assetManagementRefineModule');

  var AssetManagementMineModule = AssetManagementRefineModule.extend({
    className: 'mine',
    title: 'Filter by owner',
    filterType: 'search',

    events: {
      'click input': 'onInputClicked'
    },

    resetFilter: function() {
      this.applyFilter({ createdBy: {} });
      this.$('input').attr('checked', false);
    },

    onInputClicked: function(e) {
      if(e.currentTarget.checked === true) {
        this.applyFilter({
          createdBy: { $in:[ Origin.sessionModel.attributes.id ] }
        });
      } else {
        this.resetFilter();
      }
    }
  }, {
    template: 'assetManagementMineModule'
  });

  return AssetManagementMineModule;
});
