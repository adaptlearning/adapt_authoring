define(function(require) {

    var Origin = require('coreJS/app/origin');
    var OriginView = require('coreJS/app/views/originView');

    var SidebarFilterView = OriginView.extend({

        className: 'sidebar-filter',

        events: {
            'click .sidebar-filter-toolbar-close': 'onCloseButtonClicked',
            'keyup .sidebar-filter-search-input': 'onSearchKeyUp'
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
            console.log('wheeeeee');
            this.$('.sidebar-filter-search-input').focus();
            this.$('.sidebar-filter-item').first().addClass('selected');
        },

        onCloseButtonClicked: function() {
            this.remove();
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
            } else {
                console.log('the else');
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
            console.log('adding filter');
        }

    }, {
        template: 'sidebarFilter'
    });

    return SidebarFilterView;

})