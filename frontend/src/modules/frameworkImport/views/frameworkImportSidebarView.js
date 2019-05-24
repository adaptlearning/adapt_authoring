// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var SidebarItemView = require('modules/sidebar/views/sidebarItemView');

  var FrameworkImportSidebarView = SidebarItemView.extend({
    events: {
      'click button.show-details': 'showDetails',
      'click button.cancel': 'goBack',
      'click button.save': 'importCourse'
    },

    showDetails: function(event) {
      event && event.preventDefault();
      Origin.trigger('frameworkImport:showDetails', this);
    },

    importCourse: function(event) {
      event && event.preventDefault();
      Origin.trigger('frameworkImport:completeImport', this);
    },

    goBack: function(event) {
      event && event.preventDefault();
      Origin.router.navigateToHome();
    }
  }, {

    template: 'frameworkImportSidebar'

  });

  return FrameworkImportSidebarView;

});
