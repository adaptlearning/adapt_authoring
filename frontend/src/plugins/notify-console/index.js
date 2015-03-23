define(function(require){
	var Notify = require('coreJS/notify/notify');

	if(!console.error) console.error = console.log;
	if(!console.warn) console.warn = console.log;
	if(!console.info) console.info = console.log;
	if(!console.debug) console.debug = console.log;

	Notify.on('fatal', function(model) {
		console.error(model.get('name') + ": " + model.get('body'));
	});

	Notify.on('error', function(model) {
		console.error(model.get('name') + ": " + model.get('body'));
	});

	Notify.on('warn', function(model) {
		console.warn(model.get('name') + ": " + model.get('body'));
	});

	Notify.on('info', function(model) {
		console.info(model.get('name') + ": " + model.get('body'));
	});

	Notify.on('debug', function(model){
		console.debug(model.get('name') + ": " + model.get('body'));
	});
});
