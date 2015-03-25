// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){

  var _ = require('underscore');
  var Backbone = require('backbone');

  var Origin = {};

  _.extend(Origin, Backbone.Events);

  Origin.initialize = _.once(function() {

    Origin.tap('initialize', function() {
      initialize();
    });
    
  });

  function initialize() {
    Origin.trigger('origin:initialize');
    Backbone.history.start();
    Origin.trigger('origin:hideLoading');
  }

  Origin.tap = function(location, callback) {
    // Sets up a loading system for plugins to tap into the location
    // and load their data before everything else kicks off
    var currentLocationPlugins = _.where(pluginTaps, {location: location});
    var currentLocationPluginsLength = currentLocationPlugins.length;
    if (currentLocationPluginsLength === 0) {
      callback();
    } else {

      var count = 0;
      // Goes through each plugin registered using Origin.registerPluginTap 
      // and that have the same location
      function callPlugin() {
        currentLocationPlugins[count].pluginMethod.call(null, function() {
          count ++;
          if (count === currentLocationPluginsLength) {
            callback();
          } else {
            callPlugin();
          }
        });
      }

      callPlugin();
      
    }
  }

  Origin.editor = {};

  Origin.editor.data = {};

  Origin.location = {};

  var pluginTaps = [];

  // Register a plugin to tap into a certain location before the location loads
  Origin.registerPluginTap = function(location, pluginMethod) {
    var pluginTap = {
      location: location,
      pluginMethod: pluginMethod
    };
    pluginTaps.push(pluginTap);
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
