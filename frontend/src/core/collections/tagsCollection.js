// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

	var Backbone = require('backbone');

	var TagsCollection = Backbone.Collection.extend({

		url: '/api/autocomplete/tag'

	});

	return TagsCollection;

});