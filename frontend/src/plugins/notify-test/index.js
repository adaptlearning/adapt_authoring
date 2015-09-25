// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
	var Origin = require('coreJS/app/origin');
	var index = 0;

	Origin.on('navigation:globalMenu:toggle', function() {
		var tests = [
			function() {
				Origin.Notify.console("This is a simple log message, no options.");
				Origin.Notify.console({
					text: "This is a log message with the warn type.",
					type: "warn"
				});
			},
			function() {
				Origin.Notify.alert({
					title: "Hello world!",
					text: "This is a generic sweetalert message.",
				});
			},
			function() {
				Origin.Notify.alert({
					title: "We can also use HTML!",
					text: "This is a sweetalert with <em><strong>HTML</strong> text</em>, rather than a simple string.<br/><br/>That means embedded <a href='https://community.adaptlearning.org/course/view.php?id=2' target='_blank'>hyperlinks</a> (among other things...).",
					html: true,
					type: "info"
				});
			},
			function() {
				Origin.Notify.confirm({
					text: "Once you delete this asset, it's gone forever.",
					closeOnConfirm: false,
					callback: function onClosed() {
						Origin.Notify.alert({
							title: "OK!",
							text: "Cool - you just clicked OK!",
							type: "success"
						});
					}
				});
			},
			function() {
				var timer = 1000;
				Origin.Notify.toastr({
					title: "Success",
					text: "This is a success Toastr notification.",
					type: "success"
				});
				setTimeout(function() {
					Origin.Notify.toastr({
						title: "Info",
						text: "This is an info Toastr notification.",
						type: "info"
					});
					setTimeout(function() {
						Origin.Notify.toastr({
							title: "Warning",
							text: "This is a warning Toastr notification.",
							type: "warning"
						});
						setTimeout(function() {
							Origin.Notify.toastr({
								title: "Error!",
								text: "This is an error Toastr notification.",
								type: "error",
								callback: function() {
									Origin.Notify.alert("All toastr popups cleared (this popup was called by only passing a string).");
								}
							});
						}, timer);
					}, timer);
				}, timer);
			}
		];
		// iterate through
		tests[index++]();
	});
});
