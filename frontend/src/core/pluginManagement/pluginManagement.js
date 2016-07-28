// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

  var Origin = require('coreJS/app/origin');
  var PluginManagementView = require('coreJS/pluginManagement/views/pluginManagementView');
  var PluginManagementUploadView = require('coreJS/pluginManagement/views/pluginManagementUploadView');
  var PluginManagementSidebarView = require('coreJS/pluginManagement/views/pluginManagementSidebarView');
  var PluginManagementUploadSidebarView = require('coreJS/pluginManagement/views/pluginManagementUploadSidebarView');

  Origin.on('router:pluginManagement', function(location, subLocation, action) {
    if (!location) {
      location = 'extension';
    }

    if ('upload' === location) {
      Origin.router.createView(PluginManagementUploadView);
      Origin.sidebar.addView(new PluginManagementUploadSidebarView().$el, {});
    } else {
      Origin.router.createView(PluginManagementView, { pluginType: location });
      Origin.sidebar.addView(new PluginManagementSidebarView().$el);
    }
  });

  Origin.on('globalMenu:pluginManagement:open', function() {
    Origin.router.navigate('#/pluginManagement', {trigger: true});
  });

  var globalMenuObject = {
    "location": "global",
    "text": "Plugin Management",
    "icon": "fa-plug",
    "callbackEvent": "pluginManagement:open",
    "sortOrder": 3
  };

  Origin.on('app:dataReady login:changed', function() {
    var permissions = ["{{tenantid}}/extensiontype/*:update"];
    Origin.permissions.addRoute('pluginManagement', permissions);
    if (Origin.permissions.hasPermissions(permissions)) {
      Origin.globalMenu.addItem(globalMenuObject);
    }
  });

});
