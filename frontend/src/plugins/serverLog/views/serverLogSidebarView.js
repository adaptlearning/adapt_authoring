// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('coreJS/app/origin');
  var SidebarItemView = require('coreJS/sidebar/views/sidebarItemView');
  var ServerLogSidebarView = SidebarItemView.extend({
    events: {
       'click .sidebar-fieldset-filter' : 'toggleFilter'
    },

    toggleFilter: function(event) {
      var filterOn = $('i', event.currentTarget).hasClass('fa-toggle-on');
      $('i', event.currentTarget).toggleClass('fa-toggle-on');
      Origin.trigger('serverLog:filter:' + (filterOn ? 'off' : 'on'), $(event.currentTarget).attr('data-type'));
    }
  }, {
    template: 'serverLogSidebar'
  });
  return ServerLogSidebarView;
});
