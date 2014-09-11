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
            'keyup .dashboard-sidebar-filter-search-input':'filterProjectsByTitle',
            'click .dashboard-sidebar-filter-clear': 'clearFilterInput',
            'click .dashboard-sidebar-tag': 'onTagClicked',
            'click .dashboard-sidebar-add-tag': 'onAddTagClicked'
		},

        postRender: function() {
            this.listenTo(Origin, 'sidebarFilter:filterProjectsByTags', this.filterProjectsByTags);
            this.tags = [];
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
            Origin.trigger('dashboard:dashboardSidebarView:filterBySearch', filterText);
        },

        clearFilterInput: function(event) {
            event.preventDefault();
            var $currentTarget = $(event.currentTarget);
            $currentTarget.prev('.dashboard-sidebar-filter-input').val('').trigger('keyup');
        },

        onTagClicked: function(event) {
            var tag = $(event.currentTarget).toggleClass('selected').attr('data-tag');

            this.filterProjectsByTags(tag);
            

        },

        filterProjectsByTags: function(tag) {

            // Check if the tag is already being filtered and remove it
            if (_.contains(this.tags, tag)) {
                this.tags = _.reject(this.tags, function(tagItem) {
                    return tagItem === tag;
                });
            } else {
                // Else add it to array
                this.tags.push(tag);
            }

            Origin.trigger('dashboard:dashboardSidebarView:filterByTags', this.tags);

        },

        onAddTagClicked: function(event) {
            var availableTags = [];
            // Go through each project and filter out duplicate tags
            // to create an array of unique project tags
            this.collection.each(function(project) {
                var tags = project.get('tags');

                _.each(tags, function(tag) {

                    var titles = _.pluck(availableTags, 'title');
                    if (!_.contains(titles, tag.title)) {
                        availableTags.push(tag);
                    }
                })
                
            });

            Origin.trigger('sidebar:sidebarFilter:add', {
                title:'Filter by Tags',
                items: availableTags
            });
        }
		
	}, {
		template: 'dashboardSidebar'
	});

	return DashboardSidebarView;

});