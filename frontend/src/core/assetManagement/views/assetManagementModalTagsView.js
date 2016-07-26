// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

    var Origin = require('coreJS/app/origin');
    var OriginView = require('coreJS/app/views/originView');

    var AssetManagementModalTagsView = OriginView.extend({

        className: 'asset-management-modal-tags sidebar-filter',

        events: {
            'click .asset-management-modal-tags-toolbar-close': 'onCloseButtonClicked',
            'keydown .asset-management-modal-tags-search-input': 'onSearchKeyDown',
            'keyup .asset-management-modal-tags-search-input': 'onSearchKeyUp',
            'click .asset-management-modal-tags-item': 'onFilterItemClicked'
        },

        initialize: function(options) {
            this.data = {};
            this.data.title = options.title;
            this.data.items = options.items;
            this.listenTo(Origin, 'remove:views', this.remove);
            this.listenTo(Origin, 'assetManagement:modalTags:remove', this.remove);
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
            // Position filter to filter button
            var offsetLeft = $('.asset-management-modal-add-tag').offset().left;
            this.$el.css({'left': offsetLeft, 'display': 'block'});
            // Bring focus to the filter input field
            this.$('.asset-management-modal-tags-search-input').focus();
            // First item should be selected so the user can press enter
            this.$('.asset-management-modal-tags-item').first().addClass('selected');
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
            var $selectedItem = this.$('.asset-management-modal-tags-item.selected');
            var $prevItem = $selectedItem.prevAll('.asset-management-modal-tags-item:visible:first');

            // First check if there's any more visible elements to navigate through
            if ($prevItem.length === 0) {
                return;
            }

            if (!$selectedItem.is(':first-child')) {
                this.$('.asset-management-modal-tags-item.selected')
                    .removeClass('selected')
                    .prevAll('.asset-management-modal-tags-item:visible:first')
                    .addClass('selected')
                    .focus();
                this.$('.asset-management-modal-tags-search-input').focus();
            }

        },

        moveDownThroughItems: function() {
            // Check if the element is the last visible one
            // as the last item cannot go any further
            var $selectedItem = this.$('.asset-management-modal-tags-item.selected');
            var $nextItem = $selectedItem.nextAll('.asset-management-modal-tags-item:visible:first');

            // First check if there's any more visible elements to navigate through
            if ($nextItem.length === 0) {
                return;
            }

            if (!$selectedItem.is(':last-child')) {
                this.$('.asset-management-modal-tags-item.selected')
                    .removeClass('selected')
                    .nextAll('.asset-management-modal-tags-item:visible:first')
                    .addClass('selected')
                    .focus();
                this.$('.asset-management-modal-tags-search-input').focus();
            }

        },

        searchItems: function(event) {

            var searchText = $(event.currentTarget).val().toLowerCase();
            this.$('.asset-management-modal-tags-item').removeClass('selected');

            this.$('.asset-management-modal-tags-item').each(function(event) {

                var itemText = $('.asset-management-modal-tags-item-inner', $(this)).text().toLowerCase();

                if (itemText.indexOf(searchText) > -1) {
                    $(this).removeClass('display-none');
                } else {
                    $(this).addClass('display-none');
                }

            });

            // Should always select the top one on search
            this.$('.asset-management-modal-tags-item:visible:first').addClass('selected').focus();
            this.$('.asset-management-modal-tags-search-input').focus();
        },

        addFilter: function() {
            var selectedTag = {
                title: this.$('.asset-management-modal-tags-item.selected').attr('data-title'),
                id: this.$('.asset-management-modal-tags-item.selected').attr('data-id')
            };
            // TODO - fix these events up
            Origin.trigger('assetManagement:modalTags:filterByTags', selectedTag);
            this.remove();
        },

        onFilterItemClicked: function(event) {
            this.$('.asset-management-modal-tags-item').removeClass('selected');
            $(event.currentTarget).addClass('selected');
            this.addFilter();
        }

    }, {
        template: 'assetManagementModalTags'
    });

    return AssetManagementModalTagsView;

})
