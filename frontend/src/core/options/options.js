// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
// A module that offers options inside the title bar

define(function(require) {

	var Origin = require('coreJS/app/origin');
	var OptionsView = require('coreJS/options/views/optionsView');

	var Options = {};

	Options.addItems = function(items) {

		var itemsCollection = new Backbone.Collection(items);
		$('#app').prepend(new OptionsView({collection:itemsCollection}).$el);

	}

	Origin.options = Options;

});