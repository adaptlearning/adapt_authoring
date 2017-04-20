// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var SidebarContainerView = require('./views/sidebarView');

  Origin.once('origin:dataReady', function() {
    $('body').append(new SidebarContainerView().$el);
  });

  Origin.sidebar = {
    addView: function($el, options) {
      // Trigger to remove current views
      Origin.trigger('sidebar:views:remove');
      // Check if element is a view element
      if (_.isElement($el[0]) !== true) {
          return console.log("Sidebar - Cannot add this object to the sidebar view. Please make sure it's the views $el");
      }
      // Trigger update of views
      Origin.trigger('sidebar:sidebarContainer:update', $el, options);
    }
  };
})
