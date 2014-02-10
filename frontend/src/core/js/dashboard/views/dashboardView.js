define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var ProjectCollection = require('coreJS/dashboard/collections/projectCollection');
  var AdaptBuilder = require('coreJS/adaptBuilder');
  var ProjectView = require('coreJS/dashboard/views/projectView');
  var BuilderView = require('coreJS/core/views/builderView');

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
      'click #dashboardMenu button': 'formclick'
    },

    addProjectViews: function() {
      this.collection.each(function(project) {
        this.$('#projects').append(new ProjectView({model:project}).$el);
      }, this);

    },

    projectRemoved: function() {
      if (this.collection.length == 0) {
        this.$('#projects').append('No projects to display');  
      }
    },

    formclick: function (ev) {
      var type = $(ev.target).data('action');
      ev.preventDefault();
      switch( type ) {
          case 'new':
            Backbone.history.navigate('/project/new', {trigger: true});
          break;
          case 'search':
            //@todo implement course search
          break;
      }
    }

  }, {
    template: 'dashboard'
  });

  return DashboardView;

});