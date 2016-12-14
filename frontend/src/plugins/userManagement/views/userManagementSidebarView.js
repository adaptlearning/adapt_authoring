// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('coreJS/app/origin');
  var SidebarItemView = require('coreJS/sidebar/views/sidebarItemView');

  var UserManagementSidebarView = SidebarItemView.extend({
    events: {
      'click button.add': 'addUser',
      'click button.addMultiple': 'addMultipleUsers'
    },

    addUser: function(e) {
      e && e.preventDefault();
      Origin.router.navigate('#/userManagement/addUser', { trigger: true });
    },

    addMultipleUsers: function(e) {
      e && e.preventDefault();
      Origin.router.navigate('#/userManagement/addMultipleUsers', { trigger: true });
    }
  }, {
    template: 'userManagementSidebar'
  });
  return UserManagementSidebarView;
});
