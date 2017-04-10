// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
    
  var Origin = require('core/app/origin');
  var SidebarItemView = require('core/sidebar/views/sidebarItemView');
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
    }

  }, {
      template: 'userProfileSidebar'
  });

  return UserProfileSidebarView;

});