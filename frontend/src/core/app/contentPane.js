// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('coreJS/app/origin');
  var ContentPaneView = require('./views/contentPaneView');

  var contentPaneView;

  Origin.contentPane = {
    addView: function(View, options) {
      contentPaneView.setView(new View(options));
    }
  };

  Origin.on('app:dataReady', function() {
    contentPaneView = new ContentPaneView();
    $('.app-inner').append(contentPaneView.$el);
  });
});
