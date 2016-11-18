// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('coreJS/app/origin');
  var SidebarItemView = require('coreJS/sidebar/views/sidebarItemView');
  var SystemInfoSidebarView = SidebarItemView.extend({
    events: {
      'click button.sidebar-button-serverLog': 'onServerLogClicked'
    },

    preRender: function() {
      this.model = new Backbone.Model({
        button: {
          label: 'Server Log',
          className: 'sidebar-button-serverLog'
        }
      });
    },

    onServerLogClicked: function(e) {
      e && e.preventDefault();
      Origin.router.navigate('#/serverLog', { trigger: true });
    }
  }, {
    template: 'systemInfoSidebar'
  });
  return SystemInfoSidebarView;
});
