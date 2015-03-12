// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

	var Origin = require('coreJS/app/origin');
	var TypeAheadView = require('coreJS/filters/views/typeAheadView');

	var Filters = {};

	Filters.add = function(type, options, $element) {

		var classes = '';
		if (type === 'typeAhead') {
			if (options.classes) {
				classes = options.classes;
			}
			$element.append(new TypeAheadView(options).$el.addClass(classes));
		}

	}

	Origin.filters = Filters;

});