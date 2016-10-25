// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('coreJS/app/origin');
  var CourseImportView = require('./views/courseImportView');
  var CourseImportSidebarView = require('./views/courseImportSidebarView');

  Origin.on('globalMenu:courseImport:open', function() {
    Origin.router.navigate('#/courseImport', { trigger: true });
  });

  Origin.on('app:dataReady login:changed', function() {
    var permissions = ["*/*:create","*/*:read","*/*:update","*/*:delete"];
    Origin.permissions.addRoute('courseImport', permissions);
    if (Origin.permissions.hasPermissions(permissions)) {
      Origin.globalMenu.addItem({
        "location": "global",
        "text": "Course import",
        "icon": "fa-upload",
        "callbackEvent": "courseImport:open"
      });
    }
  });

  Origin.on('router:courseImport', function(location, subLocation, action) {
    Origin.router.createView(CourseImportView);
    Origin.sidebar.addView(new CourseImportSidebarView().$el);
  });
});
