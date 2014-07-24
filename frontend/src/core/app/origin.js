define(function(require){

  var _ = require('underscore');
  var Backbone = require('backbone');

  var Origin = {};

  _.extend(Origin, Backbone.Events);

  Origin.initialize = _.once(function() {
      Origin.trigger('origin:initialize');
      Backbone.history.start();
      Origin.trigger('origin:hideLoading');
  });

  Origin.editor = {};

  Origin.editor.data = {};

  Origin.location = {};

  // Push sockets onto Origin object
  Origin.socket = io.connect();

  // Setup window events
  // This is abstracted so we can listenTo and remove event callbacks
  // when the view is removed without any extra code
  $(window).on('resize', function(event) {
    var $window = $(this);
    var windowWidth = $window.width();
    var windowHeight = $window.height();
    Origin.trigger('window:resize', windowWidth, windowHeight);
  })

  return Origin;

});
