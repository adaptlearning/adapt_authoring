// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
	var _ = require('underscore');
	var Origin = require('coreJS/app/origin');

	// are overridden by any values passed to Snackbar
	var defaults = {
		type: 'info',
		text: '',
		buttonText: 'Click to dismiss',
		persist: false,
		animTime: 250,
		timeout: 3000,
		callback: null
	};
	var $el;
	var html = "<div id='snackbar'><div class='body'></div><span class='close'><a	href='#'></a></span></div>";
	var timer;
	var queue = [];

	var Snackbar = function(data) {
		if(typeof data === 'string') {
			data = { text: data };
		}
		queue.push(_.extend({},defaults,data));
		if(queue.length === 1) processQueue();
	};

	var processQueue = function() {
		var data = queue[0];

		$('.body', $el).text(data.text);
		$('.close a', $el).text(data.buttonText);
		if(data.persist === true) $('.close', $el).show();
		else $('.close', $el).hide();

		$el.removeClass().addClass(data.type).fadeIn(data.animTime);
		shuntUI($el.innerHeight());

		if(!data.persist) timer = setTimeout(closeSnack, data.timeout);
	};

	var closeSnack = function(event) {
		event && event.preventDefault();
		clearInterval(timer);
		var data = queue.shift();
		$el.fadeOut(defaults.animTime, function() {
			if(data.callback) data.callback.apply();
			shuntUI($el.innerHeight()*-1);
			if(queue.length > 0) processQueue();
		});
	};

	// HACK this should be handled in the CSS
	var shuntUI = function(amount) {
		var removePx = function(value) { return parseInt(value.replace('px','')); };
		$('.sidebar').css('top', removePx($('.sidebar').css('top'))+amount);
		$('#app').css('margin-top', removePx($('#app').css('margin-top'))+amount);
		$('#app').css('height', removePx($('#app').css('height'))+(amount*-1));
		Origin.trigger('window:resize');
	};

	var init = function() {
		Origin.Notify.register('snackbar', Snackbar);
		Origin.on('app:dataReady', function() {
			$('#app').after(html);
			$el = $('#snackbar');
			$el.fadeOut(0);
			$('.close a', $el).click(closeSnack);
		});
	};

	return init;
});
