define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');
  var ProjectView = require('coreJS/project/views/projectView');
  var ProjectCollection = require('coreJS/project/collections/projectCollection');

  var DashboardView = OriginView.extend({
    settings: {
      autoRender: true,
      preferencesKey: 'dashboard'
    },

    tagName: "div",

    className: "dashboard",

    preRender: function() {
      // Set empty filters
      this.filterText = '';
      this.filterTags = [];

      this.listenTo(this.collection, 'remove', this.projectRemoved);

      // External events
      this.listenTo(Origin, 'dashboard:layout:grid', this.switchLayoutToGrid);
      this.listenTo(Origin, 'dashboard:layout:list', this.switchLayoutToList);
      this.listenTo(Origin, 'dashboard:sort:asc', this.sortAscending);
      this.listenTo(Origin, 'dashboard:sort:desc', this.sortDescending);
      this.listenTo(Origin, 'dashboard:sort:updated', this.sortLastUpdated);
      this.listenTo(Origin, 'dashboard:dashboardSidebarView:filterBySearch', this.filterCoursesBySearch);
      this.listenTo(Origin, 'dashboard:dashboardSidebarView:filterByTags', this.filterCoursesByTags);

    },

    events: {
      'click': 'removeSelectedItems'
    },

    postRender: function() {
        this.addProjectViews();
    },

    switchLayoutToList: function() {
      var $container = $('.dashboard-projects');

      $container.removeClass('grid-layout').addClass('list-layout');

      this.setUserPreference('layout','list');
    },

    switchLayoutToGrid: function() {
      var $container = $('.dashboard-projects');

      $container.removeClass('list-layout').addClass('grid-layout');

      this.setUserPreference('layout','grid');
    },

    sortAscending: function() {
      var sortedCollection = this.collection.sortBy(function(project){
        return project.get("title").toLowerCase();
      });

      this.renderProjectViews(sortedCollection);
      
      this.setUserPreference('sort','asc');
    },

    sortDescending: function() {
      var sortedCollection = this.collection.sortBy(function(project){
        return project.get("title").toLowerCase();
      });

      sortedCollection = sortedCollection.reverse();

      this.renderProjectViews(sortedCollection);

      this.setUserPreference('sort','desc');
    },

    sortLastUpdated: function() {
      var sortedCollection = this.collection.sortBy(function(project){
        return -Date.parse(project.get("updatedAt"));
      });

      this.renderProjectViews(sortedCollection);

      this.setUserPreference('sort','updated');
    },

    editProject: function(event) {
      event.preventDefault();
      var projectId = event.currentTarget.dataset.id;

      Backbone.history.navigate('/editor/' + projectId + '/menu', {trigger: true});
    },

    addProjectViews: function() {
      // Preserve the user preferences or display default mode
      var userPreferences = this.getUserPreferences();
      // Check if the user preferences are list view
      // Else if nothing is set or is grid view default to grid view
      if (userPreferences && userPreferences.layout === 'list') {
        this.switchLayoutToList();
      } else {
        this.switchLayoutToGrid();
      }

      // Check if sort is set and filter the collection
      if (userPreferences && userPreferences.sort === 'desc') {
        this.sortDescending();
      } else if (userPreferences && userPreferences.sort === 'updated') {
        this.sortLastUpdated();
      } else {
        this.sortAscending();
      }
      // Trigger event to update options UI
      Origin.trigger('options:update:ui', userPreferences);
    },

    renderProjectViews: function(projects) {
      this.$('.dashboard-projects').empty();

      _.each(projects, function(project) {
        this.$('.dashboard-projects').append(new ProjectView({model: project}).$el);
      }, this);

      // Defer imageReady check until all elements are loaded
      _.defer(_.bind(this.setupImageReady, this));

      this.evaluateProjectCount(projects);
    },

    setupImageReady: function() {
      if (this.$el.find('img').length) {
        this.$el.imageready(this.setViewToReady);
      } else {
        this.setViewToReady();
      }
    },

    evaluateProjectCount: function (projects) {
      if (projects.length == 0) {
        this.$('.dashboard-no-projects').removeClass('display-none');
      } else {
        this.$('.dashboard-no-projects').addClass('display-none');
      }
    },

    projectRemoved: function() {
      this.evaluateProjectCount(this.collection);
    },

    filterCoursesBySearch: function(filterText) {
      // Store search input text and call filterCourses
      this.filterText = filterText;

      this.filterCourses();
    },

    filterCoursesByTags: function(tags) {
      // Store tags and call filterCourses
      this.filterTags = tags;

      this.filterCourses();
      
    },

    filterCourses: function() {
      var filteredCollection = this.collection.filter(function(course) {
        var courseTitle = course.get('title').toLowerCase();
        var searchText = this.filterText.toLowerCase();
        var tags = course.get('tags');
        var shouldShowCourseBasedOnTags = false;
        var shouldShodCourseBasedOnSearch = false;

        var tagTitles = _.pluck(tags, 'title');

        // Think this should be somewhere different
        /*if (this.filterTags.length === 0 && searchText.length === 0) {
          return course;
        }*/

        _.each(this.filterTags, function (tag) {
          if (_.contains(tagTitles, tag)) {
            shouldShowCourseBasedOnTags = true;
          }
        });

        // Search should take precedence as this is the main filter
        // This is why we might want to set shouldShowCourse to false
        if (courseTitle.indexOf(searchText) > -1) {
          shouldShodCourseBasedOnSearch = true;
        }

        // Needs to check if both are true
        // also if the search string is empty but a tag matches
        // also if the filters are not selected but string matches
        if (shouldShowCourseBasedOnTags && shouldShodCourseBasedOnSearch) {
          return course;
        } else if (shouldShowCourseBasedOnTags && searchText.length === 0) {
            return course;
        } else if (shouldShodCourseBasedOnSearch && this.filterTags.length === 0) {
            return course;
        }
        


      }, this);

      this.renderProjectViews(filteredCollection);

    },

    removeSelectedItems: function(event) {
        Origin.trigger('dashboard:dashboardView:deselectItem');
    }

  }, {
    template: 'dashboard'
  });

  return DashboardView;

});
