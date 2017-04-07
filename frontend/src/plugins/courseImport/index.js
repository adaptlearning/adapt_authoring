// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('coreJS/app/origin');
  var CourseImportView = require('./views/courseImportView.js');
  var CourseImportSidebarView = require('./views/courseImportSidebarView.js');

// TODO - isReady and permissions
  var isReady = true;
  var data = {
    featurePermissions: ["*/*:create","*/*:read","*/*:update","*/*:delete"]
  };

  Origin.on('app:dataReady login:changed', function() {
    Origin.permissions.addRoute('courseImport', data.featurePermissions);

  	if (Origin.permissions.hasPermissions(data.featurePermissions)) {
  		Origin.globalMenu.addItem({
        "location": "global",
        "text": window.polyglot.t('app.courseimportmenu'),
        "icon": "fa-upload",
        "sortOrder": 5,
        "callbackEvent": "courseImport:open"
      });
  	} else {
      isReady = true;
    }
  });

  Origin.on('globalMenu:courseImport:open', function() {
    Origin.router.navigate('#/courseImport', {trigger: true});
  });

  Origin.on('router:courseImport', function(location, subLocation, action) {

    onRoute(location, subLocation, action);

  });

  var onRoute = function(location, subLocation, action) {
    var mainView, sidebarView;
    mainView = CourseImportView;
    sidebarView = CourseImportSidebarView;

    Origin.router.createView(mainView, { model: new Backbone.Model({ globalData: data }) });
    Origin.sidebar.addView(new sidebarView().$el);
  };
});
