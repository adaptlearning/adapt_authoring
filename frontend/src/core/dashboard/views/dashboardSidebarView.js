define(function(require) {

	var Origin = require('coreJS/app/origin');
	var SidebarItemView = require('coreJS/sidebar/views/sidebarItemView');

	var DashboardSidebarView = SidebarItemView.extend({

		events: {
			'click .dashboard-sidebar-add-course': 'addCourse'
		},

		addCourse: function() {
			Origin.router.navigate('#/project/new', {trigger:true});
		}

	}, {
		template: 'dashboardSidebar'
	});

	return DashboardSidebarView;

});