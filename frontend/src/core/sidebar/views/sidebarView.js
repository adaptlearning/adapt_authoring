define(function(require) {

	var Origin = require('coreJS/app/origin');
	var OriginView = require('coreJS/app/views/originView');

	var Sidebar = OriginView.extend({

		className: 'sidebar',

		initialize: function() {
			this.render();
			this.listenTo(Origin, 'sidebar:sidebarContainer:update', this.updateViews);
		},

		updateViews: function($element, options) {

			// Check if options exists
			var options = (options || {});

			// If backButton option setup backButton
			if (options.backButtonText && options.backButtonRoute) {
				this.setupBackButtonRoute(options);
			}

			// Append new view into sidebar
			// Append is better here so we can animate the current view out
			this.$('.sidebar-item-container').append($element);

		},

		setupBackButtonRoute: function(options) {
			console.log('Setting up back button route');
		}

	}, {
		template: 'sidebarView'
	});

	return Sidebar;

});