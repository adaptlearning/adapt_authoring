define(function(require){
	var Notify = require('coreJS/notify/notify');
	var PromptView = require('./views/promptView.js');

	Notify.on('*:alert', handleNotification);

	function handleNotification(model) {
		console.log('notify-prompt.handleNotification');
		new PromptView({ model: model });
	}
});
