// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
	var _ = require('underscore');
	var Origin = require('coreJS/app/origin');
	var SweetAlert = require('./sweetalert.min');

	// TODO do this properly...
	(function loadCss(url) {
    var link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = "/adaptbuilder/css/assets/sweetalert.css";
    document.getElementsByTagName("head")[0].appendChild(link);
	})();

	function getSettings(data) {
		// allow for string input
		if(_.isString(data)) {
			data = {
				title: " ",
				text: data
			};
		}

		var defaults = {
			title: null,
			animation: "slide-from-bottom",
			confirmButtonColor: "#15a4fa"
		};

		switch(data.type) {
			case "confirm":
				data.type = null;
				defaults.title = "Are you sure?";
				defaults.showCancelButton = true;
				defaults.confirmButtonText = "Yes, I'm sure";
				defaults.cancelButtonText = "No";
				break;
			case "input":
			case "success":
			case "info":
			case "error":
			case "warning":
				break;
			default:
				if(data.type) {
					Origin.	Notify.console({
						type: "error",
						text: "'" + data.type + "' is not a valid alert type"
					});
				}
				data.type = null;
		}

		// combine settings, overwriting defaults with param
		return _.extend(defaults, data);
	};

	function openPopup(data) {
		SweetAlert(getSettings(data), data.callback);
	}

	var Alert = function(data) {
		openPopup(data);
	};

	var Confirm = function(data) {
		data.type = "confirm";
		openPopup(data);
	};

	var init = function() {
		Origin.Notify.register('alert', Alert);
		Origin.Notify.register('confirm', Confirm);
	};

	return init;
});
