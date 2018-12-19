// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var ContentPaneView = require('./views/contentPaneView');

  var contentPaneView;

  Origin.contentPane = {
    setView: function(ViewClass, options) {
      contentPaneView.setView(new ViewClass(options));
    },
    enableScroll: function() {
      contentPaneView.$el.removeClass('no-scroll');
    },
    disableScroll: function() {
      contentPaneView.$el.addClass('no-scroll');
    }
  };

  Origin.on('origin:dataReady', function() {
    contentPaneView = new ContentPaneView();
    $('.app-inner').append(contentPaneView.$el);
  });
});
