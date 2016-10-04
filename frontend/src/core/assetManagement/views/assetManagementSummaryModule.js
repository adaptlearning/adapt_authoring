// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('coreJS/app/origin');
  var AssetManagementRefineModule = require('coreJS/assetManagement/views/assetManagementRefineModule');

  var AssetManagementSummaryModule = AssetManagementRefineModule.extend({
    className: 'module summary',

    events: {
      'click a.reset': 'onResetClicked'
    },

    initialize: function() {
      AssetManagementRefineModule.prototype.initialize.apply(this, arguments);

      this.listenTo(Origin, 'assetManagement:assetManagementCollection:fetched', this.update);

      // when ready, listen for filters
      this.listenTo(Origin, 'assetManagement:refine:ready', function() {
        this.hideResetButton();
        this.listenTo(Origin, 'assetManagement:refine:apply', this.showResetButton);
      });
    },

    update: function(collection) {
      if(collection) {
        this.$('.assetCount', this.$el).html(collection.length);
      }
    },

    resetFilter: function() {
      // doesn't do any filtering...
    },

    showResetButton: function() {
      this.$('a.reset').css('visibility','visible');
    },

    hideResetButton: function() {
      this.$('a.reset').css('visibility','hidden');
    },

    onResetClicked: function(e) {
      e && e.preventDefault();
      Origin.trigger('assetManagement:refine:reset');
      this.hideResetButton();
    }
  }, {
    template: 'assetManagementSummaryModule'
  });

  return AssetManagementSummaryModule;
});
