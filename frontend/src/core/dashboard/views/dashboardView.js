define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');
  var ProjectView = require('coreJS/project/views/projectView');
  var ProjectCollection = require('coreJS/project/collections/projectCollection');

  var DashboardView = OriginView.extend({

    tagName: "div",

    className: "dashboard",

    preRender: function() {

      // Set empty filters
      this.filterText = '';
      this.filterTags = [];

      this.collection = new ProjectCollection();
      this.listenTo(this.collection, 'sync', this.addProjectViews);
      this.collection.fetch();

      this.listenTo(this.collection, 'remove', this.projectRemoved);

      // External events
      this.listenTo(Origin, 'dashboard:layout:grid', this.switchLayoutToGrid);
      this.listenTo(Origin, 'dashboard:layout:list', this.switchLayoutToList);
      this.listenTo(Origin, 'dashboard:sort:asc', this.sortAscending);
      this.listenTo(Origin, 'dashboard:sort:desc', this.sortDescending);
      this.listenTo(Origin, 'dashboard:dashboardSidebarView:filterBySearch', this.filterCoursesBySearch);
      this.listenTo(Origin, 'dashboard:dashboardSidebarView:filterByTags', this.filterCoursesByTags);
    },

    events: {
      'click #dashboardMenu button'     : 'formclick',
      'click': 'removeSelectedItems'
    },

    switchLayoutToList: function() {
      var $container = $('.dashboard-projects'),
        $items = $('.project-list-item');

      $container.removeClass('grid-layout').addClass('list-layout');
      
    },

    switchLayoutToGrid: function() {
      var $container = $('.dashboard-projects'),
        $items = $('.project-list-item');

      $container.removeClass('list-layout').addClass('grid-layout');
    },

    sortAscending: function() {
      var sortedCollection = this.collection.sortBy(function(project){
        return project.get("title").toLowerCase();
      });

      this.renderProjectViews(sortedCollection);
    },

    sortDescending: function() {
      var sortedCollection = this.collection.sortBy(function(project){
        return project.get("title").toLowerCase();
      });

      sortedCollection = sortedCollection.reverse();

      this.renderProjectViews(sortedCollection);
    },

    editProject: function(event) {
      event.preventDefault();
      var projectId = event.currentTarget.dataset.id;

      Backbone.history.navigate('/editor/' + projectId + '/menu', {trigger: true});
    },

    addProjectViews: function() {
      this.renderProjectViews(this.collection.models);
    },

    renderProjectViews: function(projects) {
      this.$('.dashboard-projects').empty();

      _.each(projects, function(project) {
        this.$('.dashboard-projects').append(new ProjectView({model: project}).$el);
      }, this);

      this.evaluateProjectCount(projects);
    },

    evaluateProjectCount: function (projects) {
      if (projects.length == 0) {
        this.$('.dashboard-projects').append('No projects to display');
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
          if (searchText.length != 0) {
            
          }
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
