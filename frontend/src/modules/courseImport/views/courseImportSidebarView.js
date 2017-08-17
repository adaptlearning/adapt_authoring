// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var SidebarItemView = require('modules/sidebar/views/sidebarItemView');

  var CourseImportSidebarView = SidebarItemView.extend({
    events: {
      'click button.save': 'importCourse',
      'click button.cancel': 'goBack'
    },

    importCourse: function(event) {
      event && event.preventDefault();
      this.updateButton('.course-import-sidebar-save-button', Origin.l10n.t('app.importing'));
      Origin.trigger('courseImport:uploadCourse');
    },

    goBack: function(event) {
      event && event.preventDefault();
      Origin.router.navigateToHome();
    }
  }, {
    template: 'courseImportSidebar'
  });
  return CourseImportSidebarView;
});
