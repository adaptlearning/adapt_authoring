// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
	var Origin = require('coreJS/app/origin');
	var toastr = require('./toastr.min');

	// TODO do this properly...
	(function loadCss(url) {
		var link = document.createElement("link");
		link.type = "text/css";
		link.rel = "stylesheet";
		link.href = "/adaptbuilder/css/assets/toastr.min.css";
		document.getElementsByTagName("head")[0].appendChild(link);
	})();

	toastr.options.progressBar = true;
	toastr.options.timeOut = "5000";
	toastr.options.hideDuration = "750";

	var Toastr = function(data) {
		if(!toastr[data.type]) console.log("Notify.toastr: invalid type '" + data.type + "'");

		if(data.callback) data.onHidden = data.callback;
		toastr[data.type](data.text, data.title, data);
	};

	var init = function() {
		Origin.Notify.register('toastr', Toastr);
	};

	return init;
});
