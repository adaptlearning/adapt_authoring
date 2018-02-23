// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var SidebarItemView = require('modules/sidebar/views/sidebarItemView');

  var FrameworkImportSidebarView = SidebarItemView.extend({
    events: {
      'click button.save': 'importCourse',
      'click button.cancel': 'goBack'
    },

    importCourse: function(event) {
      event && event.preventDefault();
      Origin.trigger('frameworkImport:uploadCourse', this);
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
