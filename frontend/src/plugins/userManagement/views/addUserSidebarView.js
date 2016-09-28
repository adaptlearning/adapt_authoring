// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('coreJS/app/origin');
  var SidebarItemView = require('coreJS/sidebar/views/sidebarItemView');

  var AddUserSidebarView = SidebarItemView.extend({
    events: {
      'click button.save': 'saveUser',
      'click button.cancel': 'goBack'
    },

    saveUser: function(event) {
      event && event.preventDefault();
      Origin.trigger('userManagement:saveUser');
    },

    goBack: function(event) {
      event && event.preventDefault();
      Origin.router.navigate('#/userManagement', { trigger: true });
    }
  }, {
    template: 'addUserSidebar'
  });
  return AddUserSidebarView;
});
