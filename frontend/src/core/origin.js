// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var _ = require('underscore');
  var Backbone = require('backbone');

  var pluginTaps = [];
  var $loading;

  var Origin = {
    initialize: _.once(function() {
      // set up loading asap
      $loading = $('.loading');
      hideLoading();
      // let other code know we're about to initialise
      Origin.tap('initialize', function() {
        Origin.trigger('origin:initialize');
        Backbone.history.start();
        // Setup listeners for the loading screen
        Origin.on('origin:hideLoading', hideLoading, this);
        Origin.on('origin:showLoading', showLoading, this);
        // abstracted window events to prevent keep adding/removing in views
        $(window).on('resize', onResize);
        $(document).on('keydown', onKeyDown);
      });
    }),
    /**
    * Register a plugin to tap into a certain location before it loads
    */
    registerPluginTap: function(location, pluginMethod) {
      pluginTaps.push({
        location: location,
        pluginMethod: pluginMethod
      });
    },
    /**
    * Sets up a loading system for plugins to tap into the location
    * and load their data before everything else kicks off
    */
    tap: function(location, callback) {
      var currentLocationPlugins = _.where(pluginTaps, {location: location});
      var currentLocationPluginsLength = currentLocationPlugins.length;
      if (currentLocationPluginsLength === 0) {
        return callback();
      }
      // iterates through matching currentLocationPlugins calling the funcs
      var count = 0;
      function callPlugin() {
        currentLocationPlugins[count].pluginMethod.call(null, function() {
          var doneAll = ++count === currentLocationPluginsLength;
          doneAll ? callback() : callPlugin();
        });
      }
      callPlugin();
    },
    /**
    * Tells
    */
    removeViews: function() {
      Origin.trigger('remove:views');
    }
  };
  _.extend(Origin, Backbone.Events);

  /**
  * Private functions
  */

  function showLoading(shouldHideTopBar) {
    $loading
      .removeClass('display-none fade-out')
      .toggleClass('cover-top-bar', shouldHideTopBar);
  }

  function hideLoading() {
    $loading.addClass('fade-out');
    _.delay(_.bind(function() {
      $loading
        .addClass('display-none')
        .removeClass('cover-top-bar');
    }, this), 300);
  }

  function onKeyDown(event) {
    if($(event.target).is('input, textarea')) return;
    Origin.trigger('key:down', event);
  }

  function onResize(event) {
    var $window = $(this);
    var windowWidth = $window.width();
    var windowHeight = $window.height();
    Origin.trigger('window:resize', windowWidth, windowHeight);
  }

  return Origin;
});
