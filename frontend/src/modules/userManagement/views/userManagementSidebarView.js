// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var SidebarItemView = require('modules/sidebar/views/sidebarItemView');

  var UserManagementSidebarView = SidebarItemView.extend({
    events: {
      'click button.add': 'addUser'
    },

    addUser: function(event) {
      event && event.preventDefault();
      Origin.router.navigateTo('userManagement/addUser');
    }
  }, {
    template: 'userManagementSidebar'
  });
  return UserManagementSidebarView;
});
