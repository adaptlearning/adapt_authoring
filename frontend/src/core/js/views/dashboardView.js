define(["backbone", "handlebars"], function(Backbone, Handlebars){

  var DashboardView = Backbone.View.extend({

    tagName: "div",

    className: "dashboard",

    events: {
      'click #dashboardMenu button': 'formclick'
    },

    render: function () {
      var template = Handlebars.templates.dashboard;
      this.$el.html(template());
      return this;
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