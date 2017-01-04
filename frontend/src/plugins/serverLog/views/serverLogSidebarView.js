// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('coreJS/app/origin');
  var SidebarItemView = require('coreJS/sidebar/views/sidebarItemView');
  var ServerLogSidebarView = SidebarItemView.extend({
    events: {
       'click .showAll' : 'showAll',
       'click .sidebar-fieldset-filter' : 'toggleFilter'
    },

    showAll: function(event) {
      $(event.currentTarget).addClass('display-none');
      this.$('.sidebar-fieldset-filter i').addClass('fa-toggle-on');
      Origin.trigger('serverLog:filter:reset');
    },

    toggleFilter: function(event) {
      var filterOn = $('i', event.currentTarget).hasClass('fa-toggle-on');
      $('i', event.currentTarget).toggleClass('fa-toggle-on');
      Origin.trigger('serverLog:filter:' + (filterOn ? 'off' : 'on'), $(event.currentTarget).attr('data-type'));

      var showShowAllButton = this.$('i.fa-toggle-on').length < this.$('.sidebar-fieldset-filter').length;
      showShowAllButton ?
        this.$('.showAll').removeClass('display-none') :
        this.$('.showAll').addClass('display-none');
    }
  }, {
    template: 'serverLogSidebar'
  });
  return ServerLogSidebarView;
});
