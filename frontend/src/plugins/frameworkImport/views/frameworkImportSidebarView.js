// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('coreJS/app/origin');
  var SidebarItemView = require('coreJS/sidebar/views/sidebarItemView');

  var FrameworkImportSidebarView = SidebarItemView.extend({
    events: {
      'click button.save': 'importCourse',
      'click button.cancel': 'goBack'
    },

    importCourse: function(event) {
      event && event.preventDefault();
      this.updateButton('.framework-import-sidebar-save-button', window.polyglot.t('app.importing'));
      Origin.trigger('frameworkImport:uploadCourse');
    },

    goBack: function(event) {
      event && event.preventDefault();
      Origin.router.navigate('#/dashboard', { trigger: true });
    }
  }, {
    template: 'frameworkImportSidebar'
  });
  return FrameworkImportSidebarView;
});
