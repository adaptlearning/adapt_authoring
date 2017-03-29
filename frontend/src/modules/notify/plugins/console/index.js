// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
	var _ = require('underscore');
	var Origin = require('core/origin');

	var Console = function(data) {
		if(_.isString(data)) return console.log(data);

		if(!console[data.type]) data.type = "log";
		console[data.type](data.text);
	};

	var init = function() {
		Origin.Notify.register('console', Console);
	};

	return init;
});
