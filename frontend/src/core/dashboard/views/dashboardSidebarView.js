define(function(require) {

	var Origin = require('coreJS/app/origin');
	var SidebarItemView = require('coreJS/sidebar/views/sidebarItemView');

	var DashboardSidebarView = SidebarItemView.extend({

		events: {
			'click .dashboard-sidebar-add-course'	: 'addCourse',
			'click a.project-layout-grid' 			: 'layoutGrid',
			'click a.project-layout-list' 			: 'layoutList',
			'click a.project-sort-asc' 				: 'sortAscending',
			'click a.project-sort-desc' 			: 'sortDescending',
            'keyup .asset-management-sidebar-filter-search':'filterProjectsByTitle',
            'click .dashboard-sidebar-filter-clear': 'clearFilterInput'
		},

        preRender: function() {
            
        },

		addCourse: function() {
			Origin.router.navigate('#/project/new', {trigger:true});
		},

		layoutList: function(event) {
			event.preventDefault();

			Origin.trigger('dashboard:layout:list');
		},

		layoutGrid: function(event) {
			event.preventDefault();

			Origin.trigger('dashboard:layout:grid');
		},

		sortAscending: function(event) {
			event.preventDefault();

			Origin.trigger('dashboard:sort:asc');
		},

		sortDescending: function(event) {
			event.preventDefault();

			Origin.trigger('dashboard:sort:desc');
		},

        filterProjectsByTitle: function(event) {
            var filterText = $(event.currentTarget).val();
            Origin.trigger('dashboard:dashboardSidebarView:filter', filterText);
        },

        clearFilterInput: function(event) {
            event.preventDefault();
            var $currentTarget = $(event.currentTarget);
            $currentTarget.prev('.dashboard-sidebar-filter-input').val('').trigger('keyup');
        }
		
	}, {
		template: 'dashboardSidebar'
	});

	return DashboardSidebarView;

});