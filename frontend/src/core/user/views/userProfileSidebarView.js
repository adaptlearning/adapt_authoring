// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
    
  var Origin = require('coreJS/app/origin');
  var SidebarItemView = require('coreJS/sidebar/views/sidebarItemView');
  var Backbone = require('backbone');

  var UserProfileSidebarView = SidebarItemView.extend({

    events: {
        'click .user-profile-edit-sidebar-save'   : 'save',
        'click .user-profile-edit-sidebar-cancel' : 'cancel'
    },

    save: function(event) {
        event.preventDefault();
        this.updateButton('.user-profile-edit-sidebar-save', window.polyglot.t('app.saving'));
        Origin.trigger('userProfileSidebar:views:save');
    },

    cancel: function(event) {
        event.preventDefault();
        Backbone.history.history.back();
        Origin.trigger('editingOverlay:views:hide');
    }

  }, {
      template: 'userProfileSidebar'
  });

  return UserProfileSidebarView;

});