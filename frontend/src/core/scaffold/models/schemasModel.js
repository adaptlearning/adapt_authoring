// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

	var Origin = require('coreJS/app/origin');

	var SchemasModel = Backbone.Model.extend({

		initialize: function() {
			this.listenToOnce(Origin, 'app:userCreated', this.onUserCreated);
			this.listenTo(Origin, 'schemas:loadData', this.onUserAuthenticated);
		},

		url: 'api/content/schema',

		onUserCreated:function(callback) {
			if (Origin.sessionModel.get('isAuthenticated')) {
				this.onUserAuthenticated(callback);
			} else {
				callback.call();
			}
			
		},

		onUserAuthenticated: function(callback) {
			var that = this;
			// If so fetch the schemas model and call the callback which kicks starts the app
			this.fetch({
				error: function() {
					alert('An error occured when getting the schemas');
				},
				success: function() {
					Origin.schemas = that;
					callback.call();
				}
			});
		}

	});

	return new SchemasModel;

});