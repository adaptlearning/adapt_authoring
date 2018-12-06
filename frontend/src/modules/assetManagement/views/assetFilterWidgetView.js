// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');

  var AssetFilterWidgetView = OriginView.extend({
    className: 'assetFilterWidget',
    events: {
      'click button.filter': 'onFilterButtonClicked',
      'click button.clear': 'onClearSearchClicked',
      'keyup input.search': 'onSearchKeyup',
      'click button.add-tag': 'onAddTagClicked',
      'click .asset-management-sidebar-row-filter': 'onFilterRemovedClicked'
    },

    postRender: function() {
      this.listenTo(Origin, {
        'sidebarFilter:filterByTags': this.filterProjectsByTags,
        'sidebarFilter:addTagToSidebar': this.addTagToSidebar
      });
      this.tags = [];
      this.usedTags = [];
    },

    onAddNewAssetClicked: function() {
      Origin.router.navigateTo('assetManagement/new');
    },

    onFilterButtonClicked: function(event) {
      $filter = $(event.currentTarget);
      $icon = $('.toggle > i', $filter);
      var action = $icon.hasClass('fa-toggle-on') ? 'remove' : 'add';
      Origin.trigger('assetManagement:sidebarFilter:'+action, $filter.attr('data-filter-type'));
      $icon.toggleClass('fa-toggle-on');
    },

    onSearchKeyup: function(event, filter) {
      var filterText = $(event.currentTarget).val();
      Origin.trigger('assetManagement:sidebarView:filter', filterText);
    },

    onClearSearchClicked: function(event) {
      event.preventDefault();
      this.$('input.search').val('').trigger('keyup', [true]);
    },

    onAddTagClicked: function(event) {
      event.preventDefault();
      var availableTags = [];
      var titles = [];
      var usedTitles = _.pluck(this.usedTags, 'title');
      // Go through each tag in the collection and filter out duplicate tags
      // to create an array of unique asset tags
      this.collection.each(function(tag) {
        var title = tag.get('title');
        if (!titles.includes(title) && !usedTitles.includes(title)) {
          availableTags.push(tag.attributes);
          titles.push(title);
        }
      }, this);
      $('body').append(new FilterTagsView({ items: availableTags, $anchor: $(event.currentTarget) }).$el);
    },

    addTagToSidebar: function(tag) {
      this.usedTags.push(tag);

      var template = Handlebars.templates['sidebarRowFilter'];
      var data = {
        rowClasses: 'sidebar-row-filter',
        buttonClasses:'asset-management-sidebar-row-filter',
        tag: tag
      };
      this.$('.group.tags').append(template(data));
    },

    onFilterRemovedClicked: function(event) {
      var tag = {
        id: $(event.currentTarget).attr('data-id'),
        title: $(event.currentTarget).attr('data-title')
      };
      // Remove this tag from the usedTags
      this.usedTags = _.reject(this.usedTags, function(item) { return item.id === tag.id; });

      this.filterProjectsByTags(tag);

      $(event.currentTarget).parent().remove();
    },

    filterProjectsByTags: function(tag) {
      // Check if the tag is already being filtered and remove it
      if (_.findWhere(this.tags, { id: tag.id })) {
        this.tags = _.reject(this.tags, function(tagItem) { return tagItem.id === tag.id; });
      } else { // Else add it to array
        this.tags.push(tag);
      }
      Origin.trigger('assetManagement:assetManagementSidebarView:filterByTags', this.tags);
    }
  }, {
    template: 'assetFilterWidget'
  });

  /**
  *
  * Filter popup view
  *
  */
  var FilterTagsView = OriginView.extend({
    className: 'filter-tags',
    events: {
      'click button.close': 'remove',
      'keyup .search input': 'searchItems',
      'click .item': 'addTag'
    },

    initialize: function(options) {
      this.model = new Backbone.Model({ title: 'Filter by Tags', items: options.items });
      this.$anchor = options.$anchor;

      this.listenTo(Origin, 'remove:views sidebar:filter:remove', this.remove);
      this.render();
    },

    postRender: function() {
      var offsetTop = this.$anchor.offset().top;
      var sidebarHeight = this.$el.height();
      var windowHeight = $(window).height();

      if(offsetTop+sidebarHeight > windowHeight) {
        offsetTop = windowHeight - (sidebarHeight + 10);
      }
      this.$el.css({'top': offsetTop, 'display': 'block'});
      // resize
      var popupHeight = this.$el.outerHeight();
      var top = this.$el.offset().top;
      var containerTop = $('.items').offset().top;
      $('.items').height(popupHeight-(containerTop-top));
      // Bring focus to the filter input field
      this.$('.search input').focus();
    },

    searchItems: function(event) {
      if(event.which >= 37 && event.which <= 40) { // arrow keys
        return;
      }
      if(event.which === 13) {
        return this.$('.item.selected').click();
      }
      this.$('.item').removeClass('selected');

      var searchText = $(event.currentTarget).val().toLowerCase();

      this.$('.item').each(function(i, item) {
        $(this).toggleClass('display-none', $(this).text().toLowerCase().indexOf(searchText) <= -1);
      });
      // Should always select the top one on search
      this.$('.item:visible:first').addClass('selected').focus();
      this.$('.search input').focus();
    },

    addFilter: function() {
      var $selected = this.$('.item.selected');
      var data = { title: $selected.attr('data-title'), id: $selected.attr('data-id') };

      if (data.title && data.id) {
        Origin.trigger('sidebarFilter:filterByTags', data);
        Origin.trigger('sidebarFilter:addTagToSidebar', data);
        this.remove();
      }
    },

    addTag: function(event) {
      this.$('.sidebar-filter-item').removeClass('selected');
      $(event.currentTarget).addClass('selected');
      this.addFilter();
    }
  }, {
    template: 'assetFilterTags'
  });

  return AssetFilterWidgetView;
});
