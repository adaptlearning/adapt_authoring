// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var SidebarItemView = require('modules/sidebar/views/sidebarItemView');

  var ProjectsSidebarView = SidebarItemView.extend({
    settings: {
      autoRender: true
    },

    events: {
      'click .projects-sidebar-add-course': 'addCourse',
      'click .projects-sidebar-my-courses': 'gotoMyCourses',
      'click .projects-sidebar-shared-courses': 'gotoSharedCourses',
      'click .projects-sidebar-tenant-courses' : 'gotoTenantCourses',
      'click .sidebar-filter-clear': 'clearFilterInput',
      'click .projects-sidebar-tag': 'onFilterButtonClicked',
      'click .projects-sidebar-add-tag': 'onAddTagClicked',
      'click .projects-sidebar-row-filter': 'onFilterRemovedClicked',
      'keyup .projects-sidebar-filter-search-input': 'filterProjectsByTitle'
    },

    postRender: function() {
      this.listenTo(Origin, 'sidebarFilter:filterByTags', this.filterProjectsByTags);
      this.listenTo(Origin, 'sidebarFilter:addTagToSidebar', this.addTagToSidebar);
      this.listenTo(Origin, 'sidebar:update:ui', this.updateUI);
      this.tags = [];
      this.usedTags = [];
    },

    highlightSearchBox: function(){
      this.$('.projects-sidebar-filter-search-input').removeClass('search-highlight');
      if (this.$('.projects-sidebar-filter-search-input').val()) {
        this.$('.projects-sidebar-filter-search-input').addClass('search-highlight');
      }
    },

    updateUI: function(userPreferences) {
      if (userPreferences.search) {
        this.$('.projects-sidebar-filter-search-input').val(userPreferences.search);
      }
      this.highlightSearchBox();
      if (userPreferences.tags) {
        this.tags = userPreferences.tags;
        _.each(userPreferences.tags, this.addTagToSidebar, this);
      }
    },

    addCourse: function() {
      Origin.router.navigateTo('project/new');
    },

    gotoMyCourses: function() {
      Origin.router.navigateTo('dashboard');
    },

    gotoSharedCourses: function() {
      Origin.router.navigateTo('dashboard/shared');
    },

    gotoTenantCourses: function() {
        Origin.router.navigate('dashboard/tenant', {trigger: true});
    },

    filterProjectsByTitle: function(event, filter) {
      event && event.preventDefault();

      var filterText = $(event.currentTarget).val().trim();
      Origin.trigger('dashboard:dashboardSidebarView:filterBySearch', filterText);
      this.highlightSearchBox();
    },

    clearFilterInput: function(event) {
      event && event.preventDefault();

      var $currentTarget = $(event.currentTarget);
      $currentTarget.prev('.projects-sidebar-filter-input').val('').trigger('keyup', [true]);
      this.highlightSearchBox();
    },

    onFilterButtonClicked: function(event) {
      event && event.preventDefault();
      // toggle filter
      $currentTarget = $(event.currentTarget);
      var filterType = $currentTarget.attr('data-tag');
      if ($currentTarget.hasClass('selected')) {
        $currentTarget.removeClass('selected');
        Origin.trigger('dashboard:sidebarFilter:remove', filterType);
      } else {
        $currentTarget.addClass('selected');
        Origin.trigger('dashboard:sidebarFilter:add', filterType);
      }
    },

    onAddTagClicked: function(event) {
      event && event.preventDefault();
      var availableTags = [];
      // create an array of unique project tags
      this.collection.each(function(tag) {
        var availableTagsTitles = _.pluck(availableTags, 'title');
        var usedTagTitles = _.pluck(this.usedTags, 'title');
        if (!_.contains(availableTagsTitles, tag.get('title')) && !_.contains(usedTagTitles, tag.get('title'))) {
          availableTags.push(tag.attributes);
        }
      }, this);

      Origin.trigger('sidebar:sidebarFilter:add', {
        title: Origin.l10n.t('app.filterbytags'),
        items: availableTags
      });
    },

    onTagClicked: function(event) {
      var tag = $(event.currentTarget).toggleClass('selected').attr('data-tag');
      this.filterProjectsByTags(tag);
    },

    filterProjectsByTags: function(tag) {
      // toggle tag
      if (_.findWhere(this.tags, { id: tag.id } )) {
        this.tags = _.reject(this.tags, function(tagItem) {
          return tagItem.id === tag.id;
        });
      } else {
        this.tags.push(tag);
      }
      Origin.trigger('dashboard:dashboardSidebarView:filterByTags', this.tags);
    },

    addTagToSidebar: function(tag) {
      this.usedTags.push(tag);

      var template = Handlebars.templates['sidebarRowFilter'];
      var data = {
        rowClasses: 'sidebar-row-filter',
        buttonClasses:'projects-sidebar-row-filter',
        tag: tag
      };

      this.$('.projects-sidebar-add-tag').parent().after(template(data));
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
    template: 'projectsSidebar'
  });

  return ProjectsSidebarView;
});
