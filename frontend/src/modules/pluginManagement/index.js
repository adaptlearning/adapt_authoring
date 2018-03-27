// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

  var Origin = require('core/origin');
  var PluginManagementView = require('./views/pluginManagementView');
  var PluginManagementUploadView = require('./views/pluginManagementUploadView');
  var PluginManagementSidebarView = require('./views/pluginManagementSidebarView');
  var PluginManagementUploadSidebarView = require('./views/pluginManagementUploadSidebarView');

  Origin.on('router:pluginManagement', function(location, subLocation, action) {
    if (Origin.permissions.hasSuperPermissions()) {
      if (!location) {
        location = 'extension';
      }

      if ('upload' === location) {
        Origin.contentPane.setView(PluginManagementUploadView);
        Origin.sidebar.addView(new PluginManagementUploadSidebarView().$el, {});
      } else {
        Origin.contentPane.setView(PluginManagementView, { pluginType: location });
        Origin.sidebar.addView(new PluginManagementSidebarView().$el);
      }
     } else {
      Origin.permissions.showNoPermissionPage();
    }
  });

  Origin.on('globalMenu:pluginManagement:open', function() {
    Origin.router.navigateTo('pluginManagement');
  });

  var globalMenuObject = {
    "location": "global",
    "text": "Plugin Management",
    "icon": "fa-plug",
    "callbackEvent": "pluginManagement:open",
    "sortOrder": 3
  };

  Origin.on('origin:dataReady login:changed', function() {
    var permissions = ["{{tenantid}}/extensiontype/*:update"];
    Origin.permissions.addRoute('pluginManagement', permissions);
    if (Origin.permissions.hasPermissions(permissions)) {
      Origin.globalMenu.addItem(globalMenuObject);
    }
  });

});
