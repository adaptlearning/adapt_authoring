// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

    var Origin = require('coreJS/app/origin');
    var OriginView = require('coreJS/app/views/originView');

    var SidebarFilterView = OriginView.extend({

        className: 'sidebar-filter',

        events: {
            'click .sidebar-filter-toolbar-close': 'onCloseButtonClicked',
            'keydown .sidebar-filter-search-input': 'onSearchKeyDown',
            'keyup .sidebar-filter-search-input': 'onSearchKeyUp',
            'click .sidebar-filter-item': 'onFilterItemClicked'
        },

        initialize: function(options) {
            this.data = {};
            this.data.title = options.title;
            this.data.items = options.items;
            this.listenTo(Origin, 'remove:views', this.remove);
            this.listenTo(Origin, 'sidebar:sidebarFilter:remove', this.remove);
            this.render();
        },

        render: function() {
            var template = Handlebars.templates[this.constructor.template];
            this.$el.html(template(this.data));
            _.defer(_.bind(function() {
                this.postRender();
            }, this));
            return this;
        },

        postRender: function() {
            // Position sidebar filter to filter button
            var offsetTop = $('.sidebar-filter-button').offset().top;
            var sidebarHeight = $('.sidebar-filter').height();
            var windowHeight = $(window).height();
            
            if(offsetTop+sidebarHeight > windowHeight) {
                offsetTop = windowHeight - (sidebarHeight + 10); 
            }
 
            this.$el.css({'top': offsetTop, 'display': 'block'});

            // resize
            var popupHeight = $('.sidebar-filter').outerHeight();
            var top = $('.sidebar-filter').offset().top;
            var containerTop = $('.sidebar-filter-items').offset().top;
            $('.sidebar-filter-items').height(popupHeight-(containerTop-top));

            // Bring focus to the filter input field
            this.$('.sidebar-filter-search-input').focus();
            // First item should be selected so the user can press enter
            this.$('.sidebar-filter-item').first().addClass('selected');
        },

        onCloseButtonClicked: function() {
            this.remove();
        },

        onSearchKeyDown: function(event) {
            // This is to stop the cursor moving around the input
            // element when pressing up and down
            if (event.which === 38) {
                event.preventDefault();
            }

            if (event.which === 40) {
                event.preventDefault();
            }

        },

        onSearchKeyUp: function(event) {
            // Check whether the key pressed is up or down
            if (event.which === 38) {
                return this.moveUpThroughItems();
            }

            if (event.which === 40) {
                return this.moveDownThroughItems();
            }

            if (event.which === 13) {
                return this.addFilter();
            }

            this.searchItems(event);

        },

        moveUpThroughItems: function() {
            // Check if the element is the first one
            // as the first item cannot go any further
            var $selectedItem = this.$('.sidebar-filter-item.selected');
            var $prevItem = $selectedItem.prevAll('.sidebar-filter-item:visible:first');

            // First check if there's any more visible elements to navigate through
            if ($prevItem.length === 0) {
                return;
            }

            if (!$selectedItem.is(':first-child')) {
                this.$('.sidebar-filter-item.selected')
                    .removeClass('selected')
                    .prevAll('.sidebar-filter-item:visible:first')
                    .addClass('selected')
                    .focus();
                this.$('.sidebar-filter-search-input').focus();
            }
            
        },

        moveDownThroughItems: function() {
            // Check if the element is the last visible one
            // as the last item cannot go any further
            var $selectedItem = this.$('.sidebar-filter-item.selected');
            var $nextItem = $selectedItem.nextAll('.sidebar-filter-item:visible:first');

            // First check if there's any more visible elements to navigate through
            if ($nextItem.length === 0) {
                return;
            }

            if (!$selectedItem.is(':last-child')) {
                this.$('.sidebar-filter-item.selected')
                    .removeClass('selected')
                    .nextAll('.sidebar-filter-item:visible:first')
                    .addClass('selected')
                    .focus();
                this.$('.sidebar-filter-search-input').focus();
            }

        },

        searchItems: function(event) {

            var searchText = $(event.currentTarget).val().toLowerCase();
            this.$('.sidebar-filter-item').removeClass('selected');

            this.$('.sidebar-filter-item').each(function(event) {

                var itemText = $('.sidebar-filter-item-inner', $(this)).text().toLowerCase();

                if (itemText.indexOf(searchText) > -1) {
                    $(this).removeClass('display-none');
                } else {
                    $(this).addClass('display-none');
                }

            });

            // Should always select the top one on search
            this.$('.sidebar-filter-item:visible:first').addClass('selected').focus();
            this.$('.sidebar-filter-search-input').focus();
        },

        addFilter: function() {
            var selectedTag = {
                title: this.$('.sidebar-filter-item.selected').attr('data-title'),
                id: this.$('.sidebar-filter-item.selected').attr('data-id')
            };

            if (!selectedTag.title || !selectedTag.id) {
                return;
            }
            Origin.trigger('sidebarFilter:filterByTags', selectedTag);
            Origin.trigger('sidebarFilter:addTagToSidebar', selectedTag);
            this.remove();
        },

        onFilterItemClicked: function(event) {
            this.$('.sidebar-filter-item').removeClass('selected');
            $(event.currentTarget).addClass('selected');
            this.addFilter();
        }

    }, {
        template: 'sidebarFilter'
    });

    return SidebarFilterView;

})