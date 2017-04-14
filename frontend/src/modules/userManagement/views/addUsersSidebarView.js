// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var SidebarItemView = require('modules/sidebar/views/sidebarItemView');

  var AddUsersSidebarView = SidebarItemView.extend({
    events: {
      'click button.save': 'saveUsers',
      'click button.cancel': 'goBack'
    },

    saveUsers: function(e) {
      e && e.preventDefault();
      this.updateButton('button.save', Origin.l10n.t('app.saving'));
      Origin.trigger('userManagement:saveUsers');
    },

    goBack: function(e) {
      e && e.preventDefault();
      Origin.router.navigateTo('userManagement');
    }
  }, {
    template: 'addUsersSidebar'
  });
  return AddUsersSidebarView;
});
