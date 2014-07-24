define(function(require) {

  var Origin = require('coreJS/app/origin');
  var SidebarItemView = require('coreJS/sidebar/views/sidebarItemView');

  var PluginManagementSidebarView = SidebarItemView.extend({
    events: {
      'click .pluginManagement-sidebar-extensions'	: 'manageExtensions',
      'click .pluginManagement-sidebar-themes'	: 'manageThemes',
      'click .pluginManagement-sidebar-components'	: 'manageComponents',
      'click .pluginManagement-sidebar-dashboard'	: 'returnToDashboard'
    },

    manageExtensions: function () {
      this.managePluginType('extension');
    },

    manageThemes: function () {
      this.managePluginType('theme');
    },

    manageComponents: function () {
      this.managePluginType('component');
    },

    managePluginType: function (pluginType) {
      Origin.router.navigate('#/pluginManagement/' + pluginType, {trigger: true});
    },

    returnToDashboard: function() {
      Origin.router.navigate('#/dashboard', {trigger:true});
    },

  }, {
    template: 'pluginManagementSidebar'
  });

  return PluginManagementSidebarView;

});
