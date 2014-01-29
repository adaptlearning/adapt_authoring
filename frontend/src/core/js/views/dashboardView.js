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
      ev.preventDefault();
      console.warn('Form submit not captured');
    }

  });

  return DashboardView;

});