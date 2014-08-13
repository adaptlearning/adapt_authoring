define(function(require) {

  var Origin = require('coreJS/app/origin');
  var PluginManagementView = require('coreJS/pluginManagement/views/pluginManagementView');
  var PluginManagementSidebarView = require('coreJS/pluginManagement/views/pluginManagementSidebarView');

  Origin.on('router:pluginManagement', function(location, subLocation, action) {
    if (!location) {
      location = 'extension';
    }
    Origin.router.createView(PluginManagementView, { pluginType: location });
    var optionsObject = {
        "backButtonText": "Back to Dashboard",
        "backButtonRoute": "/#/dashboard"
    };
    Origin.sidebar.addView(new PluginManagementSidebarView().$el, optionsObject);
  });

  Origin.on('globalMenu:pluginManagement:open', function() {
    Origin.router.navigate('#/pluginManagement', {trigger: true});
  });

  var globalMenuObject = {
    "location": "global",
    "text": "Plugin Management",
    "icon": "pluginManagement",
    "callbackEvent": "pluginManagement:open"
  };

  Origin.once('app:dataReady', function() {
    Origin.globalMenu.addItem(globalMenuObject);
  });

});
