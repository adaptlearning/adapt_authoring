// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

	var Origin = require('coreJS/app/origin');
	var ActionsView = require('coreJS/actions/views/actionsView');

	var Actions = {};

	Actions.add = function(options, $element) {

		// Expects options to contain: 
		// _items: list of select options - array of objects containing text, value and applyButtonText as keys
		// placeholderText: first item in the select options
		// buttonText: Action button text
		$element.append(new ActionsView(options).$el);

	}

	Origin.actions = Actions;

});