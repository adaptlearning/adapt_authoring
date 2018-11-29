// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var SidebarView = require('./views/sidebarView');

  var view;

  Origin.sidebar = {
    show: function() {
      view.show();
    },
    hide: function() {
      view.hide();
    },
    update: function(options) {
      view.update(options);
    },
    addView: function($el) {
      // TODO remove this
    }
  };

  Origin.once('origin:dataReady', function() {
    view = new SidebarView();
    // TODO fix this
    setTimeout(function() { $('body').append(view.$el); }, 1);
  });
});
