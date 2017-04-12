// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var SidebarItemView = require('modules/sidebar/views/sidebarItemView');

  var UserManagementSidebarView = SidebarItemView.extend({
    events: {
      'click button.addUsers': 'addUsers'
    },

    addUsers: function(e) {
      e && e.preventDefault();
      Origin.router.navigateTo('userManagement/add');
    }
  }, {
    template: 'userManagementSidebar'
  });
  return UserManagementSidebarView;
});
