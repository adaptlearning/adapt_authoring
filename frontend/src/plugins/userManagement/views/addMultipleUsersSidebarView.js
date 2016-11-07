// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('coreJS/app/origin');
  var SidebarItemView = require('coreJS/sidebar/views/sidebarItemView');

  var AddMultipleUsersSidebarView = SidebarItemView.extend({
    events: {
      'click button.save': 'saveUser',
      'click button.cancel': 'goBack'
    },

    saveUser: function(e) {
      e && e.preventDefault();
      this.updateButton('button.save', window.polyglot.t('app.saving'));
      Origin.trigger('userManagement:saveUsers');
    },

    goBack: function(e) {
      e && e.preventDefault();
      Origin.router.navigate('#/userManagement', { trigger: true });
    }
  }, {
    template: 'addMultipleUsersSidebar'
  });
  return AddMultipleUsersSidebarView;
});
