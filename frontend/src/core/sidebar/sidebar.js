// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('coreJS/app/origin');
  var SidebarView = require('coreJS/sidebar/views/sidebarView');

  Origin.once('app:dataReady', initSidebar);

  function initSidebar() {
    $('body').append(new SidebarView().$el);
  }

  Origin.sidebar = {
    addView: function($el, options) {
      Origin.trigger('sidebar:views:remove');
      // verify $el is a DOM element
      if (_.isElement($el[0]) !== true) {
        return console.log('Sidebar: Can only add elements to the sidebar view');
      }
      Origin.trigger('sidebar:sidebarContainer:update', $el, options);
    }
  };
});
