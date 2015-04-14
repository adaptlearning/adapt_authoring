define(function(require){
	var Notify = require('coreJS/notify/notify');
	var PromptView = require('./views/promptView.js');

	Notify.addTemplate("alert", {
		_type: "alert",
		_prompts: [{
			label: 'ok'
		}]
	});

	Notify.on('alert', handleNotification);

	function handleNotification(model) {
		new PromptView({ model: model });
	}
});
