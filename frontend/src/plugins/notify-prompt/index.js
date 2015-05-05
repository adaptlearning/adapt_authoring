define(function(require){
	var Origin = require('coreJS/app/origin');
	var PromptView = require('./views/promptView.js');

	Origin.on('app:dataReady', function() {
		Origin.Notify.addTemplate("alert", {
			title: 'app.errortitle',
			_type: "alert",
			_prompts: [{
				label: 'ok'
			}]
		});
	});

	Origin.Notify.on('alert', handleNotification);

	function handleNotification(model) {
		new PromptView({ model: model });
	}
});
