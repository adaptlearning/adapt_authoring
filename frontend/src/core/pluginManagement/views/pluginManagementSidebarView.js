// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

  var Origin = require('core/app/origin');
  var SidebarItemView = require('core/sidebar/views/sidebarItemView');

  var PluginManagementSidebarView = SidebarItemView.extend({
    events: {
      'click .pluginManagement-sidebar-upload'	: 'onAddNewPluginClicked',
      'click .pluginManagement-sidebar-extensions'	: 'onManageExtensionsClicked',
      'click .pluginManagement-sidebar-themes'	: 'onManageThemesClicked',
      'click .pluginManagement-sidebar-components'	: 'onManageComponentsClicked',
      'click .pluginManagement-sidebar-menus'  : 'onManageMenusClicked',
      'click .pluginManagement-sidebar-getPlugins'  : 'onGetPluginsClicked',
      'click .pluginManagement-sidebar-dashboard'	: 'returnToDashboard'
    },

    onAddNewPluginClicked: function () {
      Origin.router.navigate('#/pluginManagement/upload', { trigger: true });
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
        var win = window.open("https://www.adaptlearning.org/index.php/plugin-browser/", '_blank');
    },

    managePluginType: function (pluginType) {
      Origin.router.navigate('#/pluginManagement/' + pluginType, {trigger: false});
    },

    returnToDashboard: function() {
      Origin.router.navigate('#/dashboard', {trigger:true});
    },

  }, {
    template: 'pluginManagementSidebar'
  });

  return PluginManagementSidebarView;

});
