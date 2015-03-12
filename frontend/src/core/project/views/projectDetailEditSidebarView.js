// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
    
  var Origin = require('coreJS/app/origin');
  var SidebarItemView = require('coreJS/sidebar/views/sidebarItemView');
  var Backbone = require('backbone');

  var ProjectDetailEditSidebarView = SidebarItemView.extend({

    events: {
        'click .editor-project-edit-sidebar-save'   : 'save',
        'click .editor-project-edit-sidebar-cancel' : 'cancel'
    },

    save: function(event) {
        event.preventDefault();
        this.updateButton('.editor-project-edit-sidebar-save', window.polyglot.t('app.saving'));
        Origin.trigger('projectEditSidebar:views:save');
    },

    cancel: function(event) {
        event.preventDefault();
        Backbone.history.history.back();
        Origin.trigger('editingOverlay:views:hide');
    }

  }, {
      template: 'projectDetailEditSidebar'
  });

  return ProjectDetailEditSidebarView;

});