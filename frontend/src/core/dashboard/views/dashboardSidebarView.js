// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

    var Origin = require('coreJS/app/origin');
    var SidebarItemView = require('coreJS/sidebar/views/sidebarItemView');

    var DashboardSidebarView = SidebarItemView.extend({
        settings: {
          autoRender: true
        },

        events: {
            'click .dashboard-sidebar-add-course'   : 'addCourse',
            'click .dashboard-sidebar-my-courses'   : 'gotoMyCourses',
            'click .dashboard-sidebar-shared-courses' : 'gotoSharedCourses',
            'click .dashboard-sidebar-tenant-courses' : 'gotoTenantCourses',
            'keyup .dashboard-sidebar-filter-search-input':'filterProjectsByTitle',
            'click .sidebar-filter-clear': 'clearFilterInput',
            'click .dashboard-sidebar-tag': 'onFilterButtonClicked',
            'click .dashboard-sidebar-add-tag': 'onAddTagClicked',
            'click .dashboard-sidebar-row-filter': 'onFilterRemovedClicked'
        },

        postRender: function() {
            this.listenTo(Origin, 'sidebarFilter:filterByTags', this.filterProjectsByTags);
            this.listenTo(Origin, 'sidebarFilter:addTagToSidebar', this.addTagToSidebar);
            this.listenTo(Origin, 'sidebar:update:ui', this.updateUI);
            this.tags = [];
            this.usedTags = [];
        },

        highlightSearchBox: function(){
            this.$('.dashboard-sidebar-filter-search-input').removeClass('search-highlight')
            if (this.$('.dashboard-sidebar-filter-search-input').val()) {
                this.$('.dashboard-sidebar-filter-search-input').addClass('search-highlight')
            }
        },
        
        updateUI: function(userPreferences) {
            if (userPreferences.search) {
                this.$('.dashboard-sidebar-filter-search-input').val(userPreferences.search);
            }
            this.highlightSearchBox();
            if (userPreferences.tags) {
                this.tags = userPreferences.tags;
                var systemTags = [/*'archive', 'favourites'*/];
                _.each(userPreferences.tags, function(tag) {
                    // If this tag is part of the systemTags
                    // select this tag
                    if (_.contains(systemTags, tag)) {
                        this.$('.dashboard-sidebar-tag-'+tag.title).addClass('selected');
                    } else {
                        this.addTagToSidebar(tag);
                    }
                }, this);
            }
        },

        addCourse: function() {
            Origin.router.navigate('#/project/new', {trigger:true});
        },

        gotoMyCourses: function() {
            Origin.router.navigate('#/dashboard', {trigger: true});
        },

        gotoSharedCourses: function() {
            Origin.router.navigate('#/dashboard/shared', {trigger: true});
        },

        gotoTenantCourses: function() {
            Origin.router.navigate('#/dashboard/tenant', {trigger: true});
        },

        filterProjectsByTitle: function(event, filter) {
            if (event) {
                event.preventDefault();
            }
            var filterText = $(event.currentTarget).val().trim();
            Origin.trigger('dashboard:dashboardSidebarView:filterBySearch', filterText);

            this.highlightSearchBox();
        },

        clearFilterInput: function(event) {
            event.preventDefault();
            var $currentTarget = $(event.currentTarget);
            $currentTarget.prev('.dashboard-sidebar-filter-input').val('').trigger('keyup', [true]);
            this.highlightSearchBox();
        },

        onFilterButtonClicked: function(event) {
            $currentTarget = $(event.currentTarget);
            var filterType = $currentTarget.attr('data-tag');

            // If this filter is already selected - remove filter
            // else add the filter
            if ($currentTarget.hasClass('selected')) {
                $currentTarget.removeClass('selected');
                Origin.trigger('dashboard:sidebarFilter:remove', filterType);
            } else {
                $currentTarget.addClass('selected');
                Origin.trigger('dashboard:sidebarFilter:add', filterType);
            }

        },

        onAddTagClicked: function(event) {
            event.preventDefault();
            var availableTags = [];
            // Go through each tag in the collection and filter out duplicate tags
            // to create an array of unique project tags

            this.collection.each(function(tag) {
                var availableTagsTitles = _.pluck(availableTags, 'title');
                var usedTagTitles = _.pluck(this.usedTags, 'title');
                if (!_.contains(availableTagsTitles, tag.get('title')) && !_.contains(usedTagTitles, tag.get('title'))) {
                    availableTags.push(tag.attributes);
                }

            }, this);

            Origin.trigger('sidebar:sidebarFilter:add', {
                title:'Filter by Tags',
                items: availableTags
            });
        },

        onTagClicked: function(event) {
            var tag = $(event.currentTarget).toggleClass('selected').attr('data-tag');
            this.filterProjectsByTags(tag);
        },

        filterProjectsByTags: function(tag) {
            
            // Check if the tag is already being filtered and remove it
            if (_.findWhere(this.tags, { id: tag.id } )) {
                this.tags = _.reject(this.tags, function(tagItem) {
                    return tagItem.id === tag.id;
                });
            } else {
                // Else add it to array
                this.tags.push(tag);
            }

            Origin.trigger('dashboard:dashboardSidebarView:filterByTags', this.tags);
        },
        
        addTagToSidebar: function(tag) {
            this.usedTags.push(tag);

            var template = Handlebars.templates['sidebarRowFilter'];
            var data = {
                rowClasses: 'sidebar-row-filter',
                buttonClasses:'dashboard-sidebar-row-filter',
                tag: tag
            };

            this.$('.dashboard-sidebar-add-tag').parent().after(template(data));
        },

        onFilterRemovedClicked: function(event) {
            var tag = {
                title: $(event.currentTarget).attr('data-title'),
                id: $(event.currentTarget).attr('data-id')
            }

            // Remove this tag from the usedTags
            this.usedTags = _.reject(this.usedTags, function(item) {
                return item.id === tag.id;
            });

            this.filterProjectsByTags(tag);

            $(event.currentTarget).parent().remove();
        }

    }, {
        template: 'dashboardSidebar'
    });

    return DashboardSidebarView;

});
