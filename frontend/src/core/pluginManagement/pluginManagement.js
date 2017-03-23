// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

  var Origin = require('core/app/origin');
  var PluginManagementView = require('core/pluginManagement/views/pluginManagementView');
  var PluginManagementUploadView = require('core/pluginManagement/views/pluginManagementUploadView');
  var PluginManagementSidebarView = require('core/pluginManagement/views/pluginManagementSidebarView');
  var PluginManagementUploadSidebarView = require('core/pluginManagement/views/pluginManagementUploadSidebarView');

  Origin.on('router:pluginManagement', function(location, subLocation, action) {
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
