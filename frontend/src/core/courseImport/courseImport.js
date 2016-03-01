// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('coreJS/app/origin');
  var CourseImportView = require('./views/courseImportView');
  var CourseImportSidebarView = require('./views/courseImportSidebarView');

  Origin.on('router:courseImport', function(location, subLocation, action) {
    Origin.router.createView(CourseImportView);
    Origin.sidebar.addView(new CourseImportSidebarView().$el);
  });
});
