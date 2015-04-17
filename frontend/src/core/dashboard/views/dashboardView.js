// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');
  var ProjectView = require('coreJS/project/views/projectView');
  var SharedProjectView = require('coreJS/project/views/sharedProjectView');
  var ProjectCollection = require('coreJS/project/collections/projectCollection');

  var DashboardView = OriginView.extend({

    settings: {
      autoRender: true,
      preferencesKey: 'dashboard'
    },

    className: 'dashboard',

    preRender: function(options) {
      this.setupFilterSettings();

      this.listenTo(Origin, 'window:resize', this.resizeDashboard);

      this.listenTo(Origin, 'dashboard:layout:grid', this.switchLayoutToGrid);
      this.listenTo(Origin, 'dashboard:layout:list', this.switchLayoutToList);
      // These need to pass in true to re-render the collections
      this.listenTo(Origin, 'dashboard:sort:asc', function() {
        this.sortAscending(true);
      });
      this.listenTo(Origin, 'dashboard:sort:desc', function() {
        this.sortDescending(true);
      });
      this.listenTo(Origin, 'dashboard:sort:updated', function() {
        this.sortLastUpdated(true);
      });
      this.listenTo(Origin, 'dashboard:dashboardSidebarView:filterBySearch', this.filterBySearchInput);
      this.listenTo(Origin, 'dashboard:dashboardSidebarView:filterByTags', this.filterCoursesByTags);
      this.listenTo(Origin, 'dashboard:sidebarFilter:add', this.addTag);
      this.listenTo(Origin, 'dashboard:sidebarFilter:remove', this.removeTag);
      this.listenTo(this.collection, 'add', this.appendProjectItem);
      this.listenTo(this.collection, 'sync', this.checkIfCollectionIsEmpty)
    },

    setupFilterSettings: function() {
      // Setup filtering and lazy loading settings
      this.sort = {createdAt: -1};
      this.search = {};
      this.courseLimit = -32;
      this.courseDenominator = 32;

      // Set empty filters
      this.filters = [];
      this.tags = [];

      this.collectionLength = 0;
      this.shouldStopFetches = false;
      
    },

    resizeDashboard: function() {
      var navigationHeight = $('.navigation').outerHeight();
      var locationTitleHeight = $('.location-title').outerHeight();
      var windowHeight = $(window).height();
      var actualHeight = windowHeight - (navigationHeight + locationTitleHeight);
      this.$el.css('height', actualHeight);
    },

    checkIfCollectionIsEmpty: function() {
      if (this.collection.length === 0) {
        this.$('.dashboard-no-projects').removeClass('display-none');
      } else {
        this.$('.dashboard-no-projects').addClass('display-none');
      }
    },

    postRender: function() {
      this.setupUserPreferences();

      // Fake a scroll trigger - just incase the limit is too low and no scroll bars
      $('.dashboard-projects').trigger('scroll');
      this.lazyRenderCollection();
      this.resizeDashboard();
      this.setViewToReady();
      this.setupLazyScrolling();
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

    sortAscending: function(shouldRenderProjects) {

      this.sort = {
        title: 1
      };

      this.setUserPreference('sort','asc');
      if (shouldRenderProjects) {

        this.updateCollection(true);

      }

    },

    sortDescending: function(shouldRenderProjects) {
      
      this.sort = {
        title: -1
      }

      this.setUserPreference('sort','desc');

      if (shouldRenderProjects) {

        this.updateCollection(true);

      }

    },

    sortLastUpdated: function(shouldRenderProjects) {

      this.sort = {
        updatedAt: -1
      }

      this.setUserPreference('sort','updated');

      if (shouldRenderProjects) {

        this.updateCollection(true);

      }

    },

    setupUserPreferences: function() {
      // Preserve the user preferences or display default mode
      var userPreferences = this.getUserPreferences();
      // Check if the user preferences are list view
      // Else if nothing is set or is grid view default to grid view
      if (userPreferences && userPreferences.layout === 'list') {
        this.switchLayoutToList();
      } else {
        this.switchLayoutToGrid();
      }

      // Check if there's any user preferences for search and tags
      // then set on this view
      if (userPreferences) {
        var searchString = (userPreferences.search || '');
        this.search = this.convertFilterTextToPattern(searchString);
        this.setUserPreference('search', searchString);
        this.tags = (_.pluck(userPreferences.tags, 'id') || []);
        this.setUserPreference('tags', userPreferences.tags);
      }

      // Check if sort is set and sort the collection
      if (userPreferences && userPreferences.sort === 'desc') {
        this.sortDescending();
      } else if (userPreferences && userPreferences.sort === 'updated') {
        this.sortLastUpdated();
      } else {
        this.sortAscending();
      }

      // Once everything has been setup
      // refresh the userPreferences object
      userPreferences = this.getUserPreferences();
      // Trigger event to update options UI
      Origin.trigger('options:update:ui', userPreferences);
      Origin.trigger('sidebar:update:ui', userPreferences);
    },

    lazyRenderCollection: function() {
      // Adjust limit based upon the denominator
      this.courseLimit += this.courseDenominator;
      this.updateCollection(false);
    },

    emptyProjectsContainer: function() {
      // Trigger event to kill zombie views
      Origin.trigger('dashboard:dashboardView:removeSubViews');

      // Empty collection container
      this.$('.dashboard-projects').empty();
    },

    updateCollection: function(reset) {
      // If removing items, we need to reset our limits
      if (reset) {

        // Empty container
        this.emptyProjectsContainer();
        // Reset fetches cache
        this.shouldStopFetches = false;

        this.courseLimit = 0;
        this.collectionLength = 0;
        this.collection.reset();
      }

      this.search = _.extend(this.search, {
          tags: {
              $in: this.tags
          }
      });

      // This is set when the fetched amount is equal to the collection length
      // Stops any further fetches and HTTP requests
      if (this.shouldStopFetches) {
          return;
      }

      this.collection.fetch({
        remove: reset,
        data: {
          search: this.search,
          operators : {
            skip: this.courseLimit,
            limit: this.courseDenominator,
            sort: this.sort
          } 
        },
        success: _.bind(function(data) {

          // On successful collection fetching set lazy render to enabled
           if (this.collectionLength === this.collection.length) {
              this.shouldStopFetches = true;
          } else {
              this.shouldStopFetches = false;
              this.collectionLength = this.collection.length;
          }

          this.isCollectionFetching = false;
        }, this)
      });
    },

    appendProjectItem: function(projectModel) {

      projectModel.attributes.title=this.highlight(projectModel.attributes.title)

      if (!projectModel.isEditable()) {
        this.$('.dashboard-projects').append(new SharedProjectView({ model: projectModel }).$el);
      } else {
        this.$('.dashboard-projects').append(new ProjectView({ model: projectModel }).$el);
      }
    },

    highlight: function(text){

      regExpEscape = function(str){
        var specials = /[.*+?|()\[\]{}\\$^]/g; // .*+?|()[]{}\$^
        return str.replace(specials, "\\$&");
      };

      var userPreferences =this.getUserPreferences()
      var search = userPreferences.search || '';
      var regex = new RegExp( regExpEscape(search), "gi");
      return text.replace(regex, function(term) {return '<span class="highlighted">'+ term+ '</span>'});
    },

    addTag: function(filterType) {
      // add filter to this.filters
      this.tags.push(filterType);
      this.filterCollection();
    },

    removeTag: function(filterType) {
      // remove filter from this.filters
      this.tags = _.filter(this.tags, function(item) {
          return item != filterType;
      });

      this.filterCollection();
    },

    filterCollection: function() {
      this.search.tags = this.tags.length
          ? { $in: this.tags }
          : null ;
      this.updateCollection(true);
    },

    convertFilterTextToPattern: function(filterText) {
      var pattern = '.*' + filterText.toLowerCase() + '.*';
      return { title: pattern};
    },

    filterBySearchInput: function (filterText) {
      this.filterText = filterText;
      this.search = this.convertFilterTextToPattern(filterText);
      this.setUserPreference('search', filterText);
      this.updateCollection(true);
    },

    filterCoursesByTags: function(tags) {
      this.setUserPreference('tags', tags);
      this.tags = _.pluck(tags, 'id');
      this.updateCollection(true);
    },

    setupLazyScrolling: function() {

      var $projectContainer = $('.dashboard');
      var $projectContainerInner = $('.dashboard-inner');
      // Remove event before attaching
      $projectContainer.off('scroll');

      $projectContainer.on('scroll', _.bind(function() {
        var scrollTop = $projectContainer.scrollTop();
        var scrollableHeight = $projectContainerInner.height();
        var containerHeight = $projectContainer.height();

        // If the scroll position of the assets container is
        // near the bottom
        if ((scrollableHeight-containerHeight) - scrollTop < 30) {
          if (!this.isCollectionFetching) {
            this.isCollectionFetching = true;
            this.lazyRenderCollection();
          }
        }

      }, this));
    }

  }, {
    template: 'dashboard'
  })

  return DashboardView;

});
