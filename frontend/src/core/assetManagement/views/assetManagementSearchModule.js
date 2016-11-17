// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var _ = require('underscore');
  var AssetManagementRefineModule = require('coreJS/assetManagement/views/assetManagementRefineModule');
  var Origin = require('coreJS/app/origin');

  var AssetManagementSearchModule = AssetManagementRefineModule.extend({
    className: 'search',
    renderWrapper: false,
    filterType: 'search',
    filterDelay: undefined,

    events: {
      'click button.clear': 'resetFilter',
      'keyup input.search': 'onSearchUpdate',
    },

    resetFilter: function() {
      this.$('input.search').val('');
      this.applyFilter({ title: '', description: '' });
    },

    onSearchUpdate: function(e) {
      switch(event.which) {
        case 16: // shift
        case 18: // alt
          return;
        default:
          window.clearTimeout(this.filterDelay);
          this.filterDelay = window.setTimeout(_.bind(function() {
            var filterText = $(e.currentTarget).val();
            this.applyFilter({ title: filterText, description: filterText });
          }, this), 500);
          break;
      }
    }
  }, {
    template: 'assetManagementSearchModule'
  });

  return AssetManagementSearchModule;
});
