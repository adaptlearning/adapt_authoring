// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var CourseImportView = require('./views/courseImportView.js');
  var CourseImportSidebarView = require('./views/courseImportSidebarView.js');

// TODO - isReady and permissions
  var isReady = true;
  var data = {
    featurePermissions: ["*/*:create","*/*:read","*/*:update","*/*:delete"]
  };

  Origin.on('origin:dataReady login:changed', function() {
    Origin.permissions.addRoute('courseImport', data.featurePermissions);

  	if (Origin.permissions.hasPermissions(data.featurePermissions)) {
  		Origin.globalMenu.addItem({
        "location": "global",
        "text": Origin.l10n.t('app.courseimportmenu'),
        "icon": "fa-upload",
        "sortOrder": 5,
        "callbackEvent": "courseImport:open"
      });
  	} else {
      isReady = true;
    }
  });

  Origin.on('globalMenu:courseImport:open', function() {
    Origin.router.navigateTo('courseImport');
  });

  Origin.on('router:courseImport', function(location, subLocation, action) {
    var mainView, sidebarView;
    mainView = CourseImportView;
    sidebarView = CourseImportSidebarView;

    Origin.contentPane.setView(mainView, { model: new Backbone.Model({ globalData: data }) });
    Origin.sidebar.addView(new sidebarView().$el);
  });
});
