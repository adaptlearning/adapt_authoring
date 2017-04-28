define(function (require) {
  var Origin = require('coreJS/app/origin');
  var SidebarItemView = require('coreJS/sidebar/views/sidebarItemView');

  var TenantManagementSidebarView = SidebarItemView.extend({
    events: {
      'click button.add': 'addTenant'
    },

    addTenant: function (event) {
      event && event.preventDefault();
      Origin.router.navigate('#/tenantManagement/addTenant');
    }
  }, {
      template: 'tenantManagementSidebar'
    });
  return TenantManagementSidebarView;
});
