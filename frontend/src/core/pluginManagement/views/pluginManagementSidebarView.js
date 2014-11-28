define(function(require) {

  var Origin = require('coreJS/app/origin');
  var SidebarItemView = require('coreJS/sidebar/views/sidebarItemView');

  var PluginManagementSidebarView = SidebarItemView.extend({
    events: {
      'click .pluginManagement-sidebar-upload'	: 'onAddNewPluginClicked',
      'click .pluginManagement-sidebar-extensions'	: 'onManageExtensionsClicked',
      'click .pluginManagement-sidebar-themes'	: 'onManageThemesClicked',
      'click .pluginManagement-sidebar-menus'  : 'onManageMenusClicked',
      'click .pluginManagement-sidebar-components'	: 'onManageComponentsClicked',
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

    onManageMenusClicked: function () {
      this.managePluginType('menu');
    },

    onManageComponentsClicked: function () {
      this.managePluginType('component');
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
