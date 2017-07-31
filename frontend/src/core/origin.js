// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(['require', 'underscore', 'backbone'], function(require, _, Backbone){
  var initialized = false;
  var eventTaps = [];
  var $loading;

  var Origin = _.extend({}, Backbone.Events, {
    debug: false,
    /**
    * Performs the necessary set-up steps
    */
    initialize: _.once(function() {
      listenToWindowEvents();
      Origin.trigger('schemas:loadData', function() {
        Origin.trigger('origin:dataReady');
        initLoading();
        initialized = true;
        Origin.trigger('origin:initialize');
      });
    }),
    /**
    * Saves session on the Origin object
    */
    startSession: function(session) {
      Origin.sessionModel = session;
      session.fetch({
        success: function() {
          Origin.trigger('origin:sessionStarted');
          Origin.initialize();
        },
        error: console.error
      });
    },
    /**
    * Whether the Origin object has loaded
    */
    hasInitialized: function() {
      return initialized;
    },
    /**
    * Override to allow for tapping and debug logging
    * TODO this is probably very inefficient, look into this
    */
    trigger: function(eventName, data) {
      var args = arguments;
      callTaps(eventName, function() {
        if(Origin.debug){
          console.log('Origin.trigger:', eventName, (data ? data : ''));
        }
        Backbone.Events.trigger.apply(Origin, args);
      });
    },
    /**
    * Register a function to tap into a certain event before it fires
    */
    tap: function(event, callback) {
      eventTaps.push({ event: event, callback: callback });
    },
    /**
    * Tells views to clean themselves up
    */
    removeViews: function() {
      Origin.trigger('remove:views');
    }
  });

  /**
  * Private functions
  */

  function initLoading() {
    $loading = $('.loading');
    hideLoading();

    Origin.on('origin:hideLoading', hideLoading, Origin);
    Origin.on('origin:showLoading', showLoading, Origin);
  }

  // abstracted window events
  function listenToWindowEvents() {
    $(document).on('keydown', onKeyDown);
    $(window).on('resize', onResize);
    $(window).on('blur focus', onFocusBlur);
  }

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

  /**
  * Calls all 'tapped' functions before continuing
  */
  function callTaps(event, callback) {
    var taps = _.where(eventTaps, { event: event });
    // recurse
    function callTap() {
      var tap = taps.pop();
      if(!tap) return callback();
      tap.callback.call(Origin, callTap);
    }
    callTap();
  }

  /**
  * Event handling
  */

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

  function onFocusBlur(event) {
    var $win = $('window');
    var prevType = $win.data("prevType");
    // prevent double-firing
    if(prevType === event.type) return;
    // send out Origin events
    var eventName = (event.type === 'focus') ? 'active' : 'inactive';
    Origin.trigger('window:' + eventName, event);
  }

  return Origin;
});
