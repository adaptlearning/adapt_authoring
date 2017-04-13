// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var SidebarItemView = require('modules/sidebar/views/sidebarItemView');

  var PluginManagementSidebarView = SidebarItemView.extend({
    events: {
      'click .pluginManagement-sidebar-upload': 'onAddNewPluginClicked',
      'click .pluginManagement-sidebar-extensions': 'onManageExtensionsClicked',
      'click .pluginManagement-sidebar-themes': 'onManageThemesClicked',
      'click .pluginManagement-sidebar-components': 'onManageComponentsClicked',
      'click .pluginManagement-sidebar-menus': 'onManageMenusClicked',
      'click .pluginManagement-sidebar-getPlugins': 'onGetPluginsClicked'
    },

    onAddNewPluginClicked: function () {
      Origin.router.navigateTo('pluginManagement/upload');
    },

    onManageExtensionsClicked: function () {
      this.managePluginType('extension');
    },

    onManageThemesClicked: function () {
      this.managePluginType('theme');
    },

    onManageComponentsClicked: function () {
      this.managePluginType('component');
    },

    onManageMenusClicked: function () {
      this.managePluginType('menu');
    },

    onGetPluginsClicked: function () {
      window.open("https://www.adaptlearning.org/index.php/plugin-browser/", '_blank');
    },

    managePluginType: function (pluginType) {
      Origin.router.navigateTo('pluginManagement/' + pluginType);
    }
  }, {
    template: 'pluginManagementSidebar'
  });

  return PluginManagementSidebarView;
});
