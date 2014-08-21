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
      this.collection = new ProjectCollection();
      this.listenTo(this.collection, 'sync', this.addProjectViews);
      this.collection.fetch();

      this.listenTo(this.collection, 'remove', this.projectRemoved);

      // External events
      this.listenTo(Origin, 'dashboard:layout:grid', this.switchLayoutToGrid);
      this.listenTo(Origin, 'dashboard:layout:list', this.switchLayoutToList);
      this.listenTo(Origin, 'dashboard:sort:asc', this.sortAscending);
      this.listenTo(Origin, 'dashboard:sort:desc', this.sortDescending);
      this.listenTo(Origin, 'dashboard:dashboardSidebarView:filter', this.filterProjects);
    },

    events: {
      'click #dashboardMenu button'     : 'formclick',
      'click a#sortProjectsByName'      : 'sortProjectsByName',
      'click a#sortProjectsByAuthor'    : 'sortProjectsByAuthor',
      'click a#sortProjectsByLastEdit'  : 'sortProjectsByLastEdit',
      'keyup .dashboard-sidebar-filter-input': 'filterProjectsByTitle',
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

    sortProjectsByAuthor: function(e) {
      e.preventDefault();

      var sortedCollection = this.collection.sortBy(function(project){
        return project.get("createdBy").toLowerCase();
      });

      this.renderProjectViews(sortedCollection);
    },

    sortProjectsByName: function(e) {
      e.preventDefault();

      var sortedCollection = this.collection.sortBy(function(project){
        return project.get("name").toLowerCase();
      });

      this.renderProjectViews(sortedCollection);
    },

    sortProjectsByLastEdit: function(e) {
      e.preventDefault();

      // Temporary variable as we're augmenting the collection
      var collection = this.collection;
      // Append a JavaScript date object to the temporary model so we can sort
      _.each(collection.models, function(project) {
        var newDate = new Date(project.get("lastUpdated"));
        project.set({'lastUpdatedDate': newDate});
      });

      var sortedCollection = collection.sortBy(function(project){
        return -project.get("lastUpdatedDate");
      });

      this.renderProjectViews(sortedCollection);
    },

    filterProjects: function(filterText) {
      var filteredCollection = _.filter(this.collection.models, function(model) {
        return model.get('title').toLowerCase().indexOf(filterText.toLowerCase()) > -1;
      });

      this.renderProjectViews(filteredCollection);
    },

    filterProjectsByTitle: function (event) {
      var criteria = $(event.currentTarget).val();
      this.filterProjects(criteria);
    },

    removeSelectedItems: function(event) {
        Origin.trigger('dashboard:dashboardView:deselectItem');
    }

  }, {
    template: 'dashboard'
  });

  return DashboardView;

});
