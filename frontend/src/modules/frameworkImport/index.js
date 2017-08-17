// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var FrameworkImportView = require('./views/frameworkImportView.js');
  var FrameworkImportSidebarView = require('./views/frameworkImportSidebarView.js');

// TODO - isReady and permissions
  var isReady = true;
  var data = {
    featurePermissions: ["*/*:create","*/*:read","*/*:update","*/*:delete"]
  };

  Origin.on('origin:dataReady login:changed', function() {
    Origin.permissions.addRoute('frameworkImport', data.featurePermissions);

  	if(!Origin.permissions.hasPermissions(data.featurePermissions)) {
      isReady = true;
      return;
    }
		Origin.globalMenu.addItem({
      "location": "global",
      "text": Origin.l10n.t('app.frameworkimportmenu'),
      "icon": "fa-upload",
      "sortOrder": 6,
      "callbackEvent": "frameworkImport:open"
    });
  });

  Origin.on('globalMenu:frameworkImport:open', function() {
    Origin.router.navigate('#/frameworkImport', {trigger: true});
  });

  Origin.on('router:frameworkImport', function(location, subLocation, action) {
    Origin.contentPane.setView(FrameworkImportView, { model: new Backbone.Model({ globalData: data }) });
    Origin.sidebar.addView(new FrameworkImportSidebarView().$el);
  });
});
