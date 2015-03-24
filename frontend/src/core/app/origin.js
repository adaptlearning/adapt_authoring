// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){

  var _ = require('underscore');
  var Backbone = require('backbone');

  var Origin = {};

  _.extend(Origin, Backbone.Events);

  Origin.initialize = _.once(function() {
    var initializePluginsLength = initializePlugins.length;
    if (initializePluginsLength === 0) {
      initialize();
    } else {
      var count = 0;

      function callPlugin() {
        initializePlugins[count].call(null, function() {
          count ++;
          if (count === initializePluginsLength) {
            initialize();
          } else {
            callPlugin();
          }
        });
      }

      callPlugin();
      
    }
  });

  function initialize() {
    Origin.trigger('origin:initialize');
    Backbone.history.start();
    Origin.trigger('origin:hideLoading');
  }

  Origin.editor = {};

  Origin.editor.data = {};

  Origin.location = {};

  var initializePlugins = [];

  Origin.plugins = {
    addPluginToInitialize: function(pluginMethod) {
      initializePlugins.push(pluginMethod);
    }
  };

  // Setup window events
  // This is abstracted so we can listenTo and remove event callbacks
  // when the view is removed without any extra code
  $(window).on('resize', function(event) {
    var $window = $(this);
    var windowWidth = $window.width();
    var windowHeight = $window.height();
    Origin.trigger('window:resize', windowWidth, windowHeight);
  });

  $(document).on('keydown', function(event) {
    if ($(event.target).is('input, textarea')) {
      return;
    }
    Origin.trigger('key:down', event);
  });

  return Origin;

});
