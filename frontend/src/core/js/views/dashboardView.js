define(function(require){

  var Backbone = require('backbone');
  var ProjectCollection = require('coreCollections/projectCollection');
  var AdaptBuilder = require('coreJS/adaptBuilder');
  var ProjectView = require('coreViews/projectView');

  var DashboardView = Backbone.View.extend({

    tagName: "div",

    className: "dashboard-view",

    initialize: function() {
      this.collection = new ProjectCollection();
      this.collection.fetch();
      this.listenTo(AdaptBuilder, 'remove:views', this.remove);
      this.listenTo(this.collection, 'sync', this.addProjectViews)
      this.render();
    },

    events: {
      'click #dashboardMenu button': 'formclick'
    },

    render: function () {
      var template = Handlebars.templates.dashboard;
      this.$el.html(template()).appendTo('#app');
      return this;
    },

    addProjectViews: function() {
      this.collection.each(function(project) {
        this.$('#projects').append(new ProjectView({model:project}).$el);
      }, this);
    },

    formclick: function (ev) {
      var type = $(ev.target).data('action');
      ev.preventDefault();
      switch( type ) {
          case 'new':
            Backbone.history.navigate('/project/edit/-1', {trigger: true});
          break;
          case 'search':
            //@todo implement course search
          break;
      }
    }

  });

  return DashboardView;

});