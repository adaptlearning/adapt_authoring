// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('coreJS/app/origin');
  var SystemInfoView = require('./views/systemInfoView.js');
  var SystemInfoSidebarView = require('./views/systemInfoSidebarView.js');

  Origin.on('globalMenu:systemInfo:open', function() {
    Origin.router.navigate('#/systemInfo', {trigger: true});
  });

  Origin.on('app:dataReady login:changed', function() {
    var permissions = ["*/*:create","*/*:read","*/*:update","*/*:delete"];
    Origin.permissions.addRoute('systemInfo', permissions);
    if (Origin.permissions.hasPermissions(permissions)) {
      Origin.globalMenu.addItem({
        "location": "global",
        "text": window.polyglot.t('app.systeminformation'),
        "icon": "fa-tachometer",
        "callbackEvent": "systemInfo:open"
      });
    }
  });

  Origin.on('router:systemInfo', function(location, subLocation, action) {
    Origin.trigger('location:title:update', {
      title: window.polyglot.t('app.systeminformation')
    });
    Origin.sidebar.addView(new SystemInfoSidebarView().$el);
    Origin.router.createView(SystemInfoView);
  });
});
