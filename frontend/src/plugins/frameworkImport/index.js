// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('coreJS/app/origin');
  var FrameworkImportView = require('./views/frameworkImportView.js');
  var FrameworkImportSidebarView = require('./views/frameworkImportSidebarView.js');

// TODO - isReady and permissions
  var isReady = true;
  var data = {
    featurePermissions: ["*/*:create","*/*:read","*/*:update","*/*:delete"]
  };

  Origin.on('app:dataReady login:changed', function() {
    Origin.permissions.addRoute('frameworkImport', data.featurePermissions);

  	if (Origin.permissions.hasPermissions(data.featurePermissions)) {
  		Origin.globalMenu.addItem({
        "location": "global",
        "text": window.polyglot.t('app.frameworkimportmenu'),
        "icon": "fa-upload",
        "sortOrder": 6,
        "callbackEvent": "frameworkImport:open"
      });
  	} else {
      isReady = true;
    }
  });

  Origin.on('globalMenu:frameworkImport:open', function() {
    Origin.router.navigate('#/frameworkImport', {trigger: true});
  });

  Origin.on('router:frameworkImport', function(location, subLocation, action) {

    onRoute(location, subLocation, action);

  });

  var onRoute = function(location, subLocation, action) {
    var mainView, sidebarView;
    mainView = FrameworkImportView;
    sidebarView = FrameworkImportSidebarView;

    Origin.router.createView(mainView, { model: new Backbone.Model({ globalData: data }) });
    Origin.sidebar.addView(new sidebarView().$el);
  };
});
