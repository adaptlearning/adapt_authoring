define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var AdaptBuilder = require('coreJS/app/adaptBuilder');
  var BuilderView = require('coreJS/app/views/builderView');
  var ProjectView = require('coreJS/dashboard/views/projectView');
  var ProjectCollection = require('coreJS/dashboard/collections/projectCollection');

  var DashboardView = BuilderView.extend({

    tagName: "div",

    className: "dashboard-view",

    preRender: function() {
      this.collection = new ProjectCollection();
      this.collection.fetch();

      this.listenTo(AdaptBuilder, 'remove:views', this.remove);
      this.listenTo(this.collection, 'sync', this.addProjectViews);
      this.listenTo(this.collection, 'remove', this.projectRemoved);
    },

    events: {
      'click #dashboardMenu button'    : 'formclick',
      'click a#sortProjectsByName'     : 'sortProjectsByName',
      'click a#sortProjectsByAuthor'   : 'sortProjectsByAuthor',
      'click a#sortProjectsByLastEdit' : 'sortProjectsByLastEdit'
    },

    addProjectViews: function() {
      this.renderProjectViews(this.collection.models);
    },

    renderProjectViews: function(projects) {
      this.$('#projects').empty();

      _.each(projects, function(project) {
        this.$('#projects').append(new ProjectView({model: project}).$el);
      }, this);

      this.evaluateProjectCount(projects);
    },

    evaluateProjectCount: function (projects) {
      if (projects.length == 0) {
        this.$('#projects').append('No projects to display');  
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
      // var collection = this.collection;
      var filteredCollection = _.filter(this.collection.models, function(model) {
        return model.get('name').toLowerCase().indexOf(filterText.toLowerCase()) > -1;
      });

      this.renderProjectViews(filteredCollection);
    },

    formclick: function (e) {
      e.preventDefault();

      var type = $(e.target).data('action');

      switch (type) {
          case 'new':
            Backbone.history.navigate('/project/new', {trigger: true});
          break;
          case 'filter':
            var criteria = $('#filterCriteria').val();
            this.filterProjects(criteria);
          break;
      }
    }

  }, {
    template: 'dashboard'
  });

  return DashboardView;

});
