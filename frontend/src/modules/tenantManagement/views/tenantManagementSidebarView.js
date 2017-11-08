define(function (require) {
  var Origin = require('core/origin');
  var SidebarItemView = require('modules/sidebar/views/sidebarItemView');

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
