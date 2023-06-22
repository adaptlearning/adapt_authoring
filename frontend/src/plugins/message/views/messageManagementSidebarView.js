// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

  var Origin = require('core/origin');
  var SidebarItemView = require('modules/sidebar/views/sidebarItemView');
  var Backbone = require('backbone');

  var MessageManagementSidebarView = SidebarItemView.extend({

    events: {
        'click .message-management-edit-sidebar-save'   : 'save',
        'click .message-management-edit-sidebar-cancel' : 'cancel'
    },

    save: function(event) {
        event.preventDefault();
        this.updateButton('.message-management-edit-sidebar-save', Origin.l10n.t('app.saving'));
        Origin.trigger('messageManagementSidebar:views:save');
    },

    cancel: function(event) {
        event.preventDefault();
        Backbone.history.history.back();
    }

  }, {
      template: 'messageManagementSidebar'
  });

  return MessageManagementSidebarView;

});
