define(function(require){
	var Notify = require('coreJS/notify/notify');

	Notify.addTemplate('log', {
		name: "",
		_type: "log"
	});

	if(!console.error) console.error = console.log;
	if(!console.warn) console.warn = console.log;
	if(!console.info) console.info = console.log;
	if(!console.debug) console.debug = console.log;

	Notify.on('log', function(model) {
		switch(model.get('_level')) {
			case 'fatal':
				console.error(model.toString());
				break;
			case 'error':
				console.error(model.toString());
				break;
			case 'warn':
				console.warn(model.toString());
				break;
			case 'info':
				console.info(model.toString());
				break;
			case 'debug':
				console.debug(model.toString());
				break;
			default:
				console.log(model.toString());
				break;
		}
	});
});
