// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var _ = require('underscore');
  var Origin = require('core/origin');

  // are overridden by any values passed to Snackbar
  var defaults = {
    type: 'info',
    text: '',
    buttonText: '',
    persist: false,
    animTime: 400,
    timeout: 3000,
    callback: null
  };
  var $el;
  var timer;
  var queue = [];

  var Snackbar = function(data) {
    if(typeof data === 'string') {
      data = { text: data };
    }
    queue.push(_.extend({},defaults,data));
    if(queue.length === 1) processQueue();
  };

  function processQueue() {
    var data = queue[0];
    $el = $('<div></div>', { id: 'snackbar', 'class': data.type })
      .append($('<div></div>', { 'class': 'body', text: data.text }));

    if (data.persist && data.buttonText) {
      $el.append($('<button></button>', { 'class': 'close', text: data.buttonText }));
    }

    $el.appendTo('.app-inner').velocity('fadeIn', {
      duration: data.animTime,
      display: 'flex'
    });

    if (!data.persist) timer = setTimeout(closeSnack, data.timeout);
  };

  function closeSnack(event) {
    clearTimeout(timer);
    var data = queue.shift();

    $el.velocity('fadeOut', {
      duration: data.animTime,
      complete: function() {
        $el.remove();
        if (data.callback) data.callback.apply();
        if (queue.length > 0) processQueue();
      }
    });
  };

  var init = function() {
    Origin.Notify.register('snackbar', Snackbar);

    Origin.on('origin:dataReady', function() {
      $('.app-inner').on('click', '#snackbar .close', closeSnack);
    });
  };

  return init;

});
