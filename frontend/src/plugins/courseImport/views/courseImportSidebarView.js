// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('coreJS/app/origin');
  var SidebarItemView = require('coreJS/sidebar/views/sidebarItemView');

  var CourseImportSidebarView = SidebarItemView.extend({
    events: {
      'click button.save': 'importCourse',
      'click button.cancel': 'goBack'
    },

    importCourse: function(event) {
      event && event.preventDefault();
      this.updateButton('.course-import-sidebar-save-button', window.polyglot.t('app.importing'));
      Origin.trigger('courseImport:uploadCourse');
    },

    goBack: function(event) {
      event && event.preventDefault();
      Origin.router.navigate('#/dashboard', { trigger: true });
    }
  }, {
    template: 'courseImportSidebar'
  });
  return CourseImportSidebarView;
});
