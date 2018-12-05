// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var PluginManagementView = require('./views/pluginManagementView');
  var PluginManagementUploadView = require('./views/pluginManagementUploadView');

  Origin.on('origin:dataReady login:changed', function() {
    var permissions = ["{{tenantid}}/extensiontype/*:update"];
    Origin.permissions.addRoute('pluginManagement', permissions);

    if(!Origin.permissions.hasPermissions(permissions)) {
      return;
    }
    Origin.globalMenu.addItem({
      "location": "global",
      "text": "Plugin Management",
      "icon": "fa-plug",
      "callbackEvent": "pluginManagement:open",
      "sortOrder": 3
    });
  });

  Origin.on('globalMenu:pluginManagement:open', function() {
    Origin.router.navigateTo('pluginManagement');
  });

  Origin.on('router:pluginManagement', function(location, subLocation, action) {
    if (!location) {
      location = 'extension';
    }
    if ('upload' === location) {
      Origin.contentPane.setView(PluginManagementUploadView);
      Origin.sidebar.update({
        actions: [
          { name: 'upload', type: 'primary', labels: { default: 'app.upload' } },
          { name: 'cancel', type: 'secondary', label: 'app.cancel' },
        ]
      });
    } else {
      Origin.contentPane.setView(PluginManagementView, { pluginType: location });
      Origin.sidebar.update({
        actions: [
          { name: 'upload', type: 'primary', label: 'app.uploadplugin' },
        ],
        links: [
          { name: 'extensions', page: 'extension', label: 'app.extensions', icon: 'fa-plug' },
          { name: 'components', page: 'component', label: 'app.components', icon: 'fa-cubes' },
          { name: 'themes', page: 'theme', label: 'app.themes', icon: 'fa-image' },
          { name: 'menus', page: 'menu', label: 'app.menus', icon: 'fa-sitemap' },
          { name: 'pluginBrowser', page: 'pluginBrowser', label: 'app.getnewplugins', icon: 'fa-external-link' }
        ]
      });
    }
  });
});
