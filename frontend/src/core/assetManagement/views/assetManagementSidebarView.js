// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

    var Origin = require('coreJS/app/origin');
    var SidebarItemView = require('coreJS/sidebar/views/sidebarItemView');

    var AssetManagementSidebarView = SidebarItemView.extend({

        events: {
            'click .asset-management-sidebar-new': 'onAddNewAssetClicked',
            'click .asset-management-sidebar-filter-button': 'onFilterButtonClicked',
            'click .sidebar-filter-clear': 'onClearSearchClicked',
            'keyup .asset-management-sidebar-filter-search': 'onSearchKeyup',
            'click .asset-management-sidebar-add-tag': 'onAddTagClicked',
            'click .asset-management-sidebar-row-filter': 'onFilterRemovedClicked'
        },

        postRender: function() {
            this.listenTo(Origin, 'sidebarFilter:filterByTags', this.filterProjectsByTags);
            this.listenTo(Origin, 'sidebarFilter:addTagToSidebar', this.addTagToSidebar);
            this.tags = [];
            this.usedTags = [];
        },

        onAddNewAssetClicked: function() {
            Origin.router.navigate('#/assetManagement/new', { trigger: true });
        },

        onFilterButtonClicked: function(event) {
            $currentTarget = $(event.currentTarget);
            var filterType = $currentTarget.attr('data-filter-type');

            // If this filter is already selected - remove filter
            // else add the filter
            if ($currentTarget.hasClass('selected')) {
                $currentTarget.removeClass('selected');
                Origin.trigger('assetManagement:sidebarFilter:remove', filterType);
            } else {
                $currentTarget.addClass('selected');
                Origin.trigger('assetManagement:sidebarFilter:add', filterType);
            }

        },

        onSearchKeyup: function(event, filter) {
            if (13 == event.keyCode || filter) {
                var filterText = $(event.currentTarget).val();
                Origin.trigger('assetManagement:sidebarView:filter', filterText);
            }
        },

        onClearSearchClicked: function(event) {
            event.preventDefault();
            this.$('.asset-management-sidebar-filter-search').val('').trigger('keyup', [true]);
        },

        onAddTagClicked: function(event) {
            event.preventDefault();
            var availableTags = [];

            // Go through each tag in the collection and filter out duplicate tags
            // to create an array of unique asset tags
            this.collection.each(function(tag) {
                var titles = _.pluck(availableTags, 'title');
                var usedTagsTitles = _.pluck(this.usedTags, 'title');
                if (!_.contains(titles, tag.get('title')) && !_.contains(usedTagsTitles, tag.get('title'))) {
                    availableTags.push(tag.attributes);
                }
            }, this);

            Origin.trigger('sidebar:sidebarFilter:add', {
                title:'Filter by Tags',
                items: availableTags
            });
        },


        addTagToSidebar: function(tag) {
            this.usedTags.push(tag);

            var template = Handlebars.templates['sidebarRowFilter'];
            var data = {
                rowClasses: 'sidebar-row-filter',
                buttonClasses:'asset-management-sidebar-row-filter',
                tag: tag
            };

            this.$('.asset-management-sidebar-add-tag').parent().after(template(data));
        },

        onFilterRemovedClicked: function(event) {
            var tag = {
                id: $(event.currentTarget).attr('data-id'),
                title: $(event.currentTarget).attr('data-title')
            };

            // Remove this tag from the usedTags
            this.usedTags = _.reject(this.usedTags, function(item) {
                return item.id === tag.id;
            });

            this.filterProjectsByTags(tag);

            $(event.currentTarget).parent().remove();
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

            Origin.trigger('assetManagement:assetManagementSidebarView:filterByTags', this.tags);

        }

    }, {
        template: 'assetManagementSidebar'
    });

    return AssetManagementSidebarView;

});
