// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
	var Origin = require('coreJS/app/origin');
	var Toastr = require('./toastr.min');

	// TODO do this properly...
	(function loadCss(url) {
		var link = document.createElement("link");
		link.type = "text/css";
		link.rel = "stylesheet";
		link.href = "/adaptbuilder/css/assets/toastr.min.css";
		document.getElementsByTagName("head")[0].appendChild(link);
	})();

	Toastr.options.progressBar = false;
	Toastr.options.timeOut = "5000";
	Toastr.options.hideDuration = "750";

	var Toast = function(data) {
		if(!Toastr[data.type]) console.log("Notify.toast: invalid type '" + data.type + "'");

		if(data.callback) data.onHidden = data.callback;
		Toastr[data.type](data.text, data.title, data);
	};

	var init = function() {
		Origin.Notify.register('toast', Toast);
	};

	return init;
});
