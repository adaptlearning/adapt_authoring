// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
	var _ = require('underscore');
	var Backbone = require('backbone');
	var NotifyModel = require('./models/notifyModel');

	function Notify() {
		if(typeof Notify.instance !== 'object') {
			Notify.instance = this;
			_.extend(Notify.instance, Backbone.Events);

			var levels = [
				'fatal',
				'error',
				'warn',
				'info',
				'debug'
			];

			function initialise() {
				for(var i = 0, len = levels.length; i < len; i++) {
					Notify.instance[levels[i]] = _.bind(handleNotification, Notify.instance, levels[i]);
				}
			}

			function handleNotification(level, model, options) {
				if(model instanceof Error) {
					model = NotifyModel.fromError(model, options);
				}
				else {
					model = new NotifyModel(model);
				}

				// console.log(level + ':' + model.get('type') + ', ' + level + ', ' + '*:' + model.get('type') + ', *');

				// different levels of event to allow filtering (should be moved to handler?)
				this.trigger(level + ':' + model.get('_type'), model);
				this.trigger(level, model);
				this.trigger('*:' + model.get('_type'), model);
				this.trigger('*', model);
			}

			// set up
			initialise();
		}
		return Notify.instance;
	}
	return new Notify();
});
