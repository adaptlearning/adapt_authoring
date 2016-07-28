// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

	var Origin = require('coreJS/app/origin');
	var OriginView = require('coreJS/app/views/originView');
    var SidebarFilterView = require('coreJS/sidebar/views/sidebarFilterView');

	var Sidebar = OriginView.extend({

		className: 'sidebar',

		initialize: function() {
			this.render();
			this.listenTo(Origin, 'sidebar:sidebarContainer:update', this.updateViews);
			this.listenTo(Origin, 'sidebar:sidebarFilter:add', this.addFilterView);
			this.listenTo(Origin, 'sidebar:sidebarContainer:hide', this.hideSidebar);				
		},

		updateViews: function($element, options) {
			$('html').removeClass('sidebar-hide');

			// Check if options exists
			var options = (options || {});

			// If backButton option setup backButton
			if (options.backButtonText && options.backButtonRoute) {
				this.setupBackButtonRoute(options);
			} else {
				this.removeBackButtonRoute();
			}

			// Append new view into sidebar
			// Append is better here so we can animate the current view out
			this.$('.sidebar-item-container').append($element);

		},

		hideSidebar: function() {
			$('html').addClass('sidebar-hide');
		},

		setupBackButtonRoute: function(options) {
			// If breadcrumb, render template and animate in
			var template = Handlebars.templates['sidebarBreadcrumb'];
			this.$('.sidebar-breadcrumb').html(template(options));
			_.defer(function() {
				this.$('.sidebar-breadcrumb').velocity({'top': '0px', 'opacity': 1}, function() {
					Origin.trigger('sidebar:views:animateIn');
				});
			});
		},

		removeBackButtonRoute: function() {
			// If breadcrumb needs removing, animate out and trigger animateIn for the new view
			this.$('.sidebar-breadcrumb').velocity({'top': '-40px', 'opacity': 0}, function() {
				this.empty();
				Origin.trigger('sidebar:views:animateIn');
			});
		},

		addFilterView: function(options) {
			Origin.trigger('sidebar:sidebarFilter:remove');
			$('body').append(new SidebarFilterView(options).$el);
		}
	}, {
		template: 'sidebar'
	});

	return Sidebar;

});