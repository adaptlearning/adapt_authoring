// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
	var _ = require('underscore');
	var Backbone = require('backbone');
	var Origin = require('coreJS/app/origin');
	var NotifyModel = require('./models/notifyModel');

	// accessed by instanciating directly, or via Origin.Notify for convenience
	function Notify() {
		if(typeof Origin.Notify !== 'object') {
			// shorthand
			Origin.Notify = this;

			// supported levels of notification
			var levels = [
				'fatal',
				'error',
				'warn',
				'info',
				'debug'
			];

			// easy access default settings for notifications
			var templates = {};

			/**
			* Static functions
			*/

			this.addTemplate = function(name, model) {
				if(templates[name]) {
					this.warn({
						message: "Notify.addTemplate: the '" + name + "' template already exists!",
						_template: 'log'
					});
				} else {
					templates[name] = model;
				}
			};

			this.removeTemplate = function(name) {
				if(!templates[name]) {
					this.warn({
						message: "Notify.removeTemplate: couldn't find '" + name + "' template!",
						_template: 'log'
					});
				} else {
					delete templates[name];
				}
			};

			// set up
			initialise();

			function initialise() {
				_.extend(Origin.Notify, Backbone.Events);

				for(var i = 0, len = levels.length; i < len; i++) {
					Origin.Notify[levels[i]] = _.bind(handleNotification, Origin.Notify, levels[i]);
				}
			};

			function handleNotification(level, model) {
				model._level = level;

				// add in any defaults from template (not overriding model)
				if(model._template) {
					if(!templates[model._template]) {
						Origin.Notify.warn({
							message: "Notify.handleNotification: no template with the name '" + model._template + "'",
							_template: 'log'
						});
					} else {
						for(var attr in templates[model._template]) {
							if(!model[attr]) model[attr] = templates[model._template][attr];
						}
					}
				}

				if(model.error) {
					model = NotifyModel.fromError(model);
				}
				else {
					model = new NotifyModel(model);
				}

				/*
				* Trigger multiple events to allow filtering...
				*/
				this.trigger(level, model);
				this.trigger(model.get('_type'), model);
				this.trigger('*', model);
			};
		}
		return this;
	}
	return new Notify();
});
