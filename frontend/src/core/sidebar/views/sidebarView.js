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
			console.log('Update views');
			var options = (options || {});
			console.log($element, options);
			if (options.backButtonText && options.backButtonRoute) {
				this.setupBackButtonRoute();
			}
			this.$('.sidebar-item-container').append($element);
		},

		setupBackButtonRoute: function() {
			console.log('Setting up back button route');
		}

	}, {
		template: 'sidebarView'
	});

	return Sidebar;

});