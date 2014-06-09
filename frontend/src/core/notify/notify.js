define(function(require) {

	var Origin = require('coreJS/app/origin');
	var NotifyView = require('coreJS/notify/views/notifyView');
	var NotifyModel = require('coreJS/notify/models/notifyModel');
	var NotifyPushCollection = require('coreJS/notify/collections/notifyPushCollection');

	var NotifyPushes = new NotifyPushCollection();

	Origin.on('notify:alert', function(notifyObject) {
		addNotifyView('alert', notifyObject);
	});

	Origin.on('notify:prompt', function(notifyObject) {
		addNotifyView('prompt', notifyObject);
	});

	Origin.on('notify:popup', function(notifyObject) {
		addNotifyView('popup', notifyObject);
	});

	Origin.on('notify:push', function(notifyObject) {
		addNotifyView('push', notifyObject);
	});

	function addNotifyView(type, notifyObject) {
		notifyObject._type = type;

		if (type === 'push') {

			NotifyPushes.push(notifyObject);

			return;

		}
		// Not sure if we need a popup manager?
		//Origin.trigger('popup:opened');

		new NotifyView({
			model: new NotifyModel(notifyObject)
		});
	};
	
});