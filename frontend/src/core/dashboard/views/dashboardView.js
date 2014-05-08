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
      this.collection.fetch();
      this.listenTo(this.collection, 'sync', this.addProjectViews);
      this.listenTo(this.collection, 'remove', this.projectRemoved);
    },

    events: {
      'click #dashboardMenu button'    : 'formclick',
      'click a#sortProjectsByName'     : 'sortProjectsByName',
      'click a#sortProjectsByAuthor'   : 'sortProjectsByAuthor',
      'click a#sortProjectsByLastEdit' : 'sortProjectsByLastEdit',
      'click .contextMenu'              : 'handleContextMenuClick',
      'click .menu-container'           : 'toggleContextMenu'
    },

    toggleContextMenu: function(e) {
      var menu = $('#contextMenu');
      var previousId = menu.attr('data-id');

      if (previousId !== '' && (previousId == e.currentTarget.dataset.id)) {
        if (menu.hasClass('display-none')) {
          menu.removeClass('display-none');
        } else {
          menu.addClass('display-none');
        }
        return false;
      }

      menu.attr('data-id', e.currentTarget.dataset.id);
      
      menu
        .css({position: 'absolute',
          left: e.clientX - menu.width(),
          top: e.clientY + 10})
        .removeClass('display-none');
    },

    handleContextMenuClick: function(e) {
      e.preventDefault();
      $('#contextMenu').addClass('display-none');

      var projectId = e.currentTarget.dataset.id;

      switch(e.target.id) {
        case 'linkEditProject':
          Backbone.history.navigate('/editor/' + projectId + '/menu', {trigger: true});
          break;

        case 'linkEditProperties':
          Backbone.history.navigate('/project/edit/' + projectId, {trigger: true});
          break;

        case 'linkCopyProject':
          alert('TODO: Copy project');
          break;

        case 'linkDeleteProject':
          if (confirm(window.polyglot.t('app.confirmdeleteproject'))) {
            var projectToDelete = this.collection.get(projectId);

            projectToDelete.destroy();
          }
          break;
      }
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
      alert('you removed a projec');
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
