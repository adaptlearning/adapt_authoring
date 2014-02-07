//@TODO course|project
define(["backbone", "handlebars"], function(Backbone, Handlebars){

  var ProjectOverviewMenu = Backbone.View.extend({

    tagName: "div",

    className: "project-menu",

    events: {
      'click a': 'navclick'
    },

    initialize: function () {
      this.listenTo(this.model, 'change', this.render);
    },

    render: function () {

      var template = Handlebars.partials.part_projectOverviewMenu;
      this.$el.html(template(this.model.toJSON()));
      return this;
    },

    navclick: function (ev) {
      ev.preventDefault();

      var act = $(ev.target).data('action');

      if (act) {
        act = act.split('-');

        switch(act[0]){
          case 'add':
            switch(act[1]){
              default:
                alert('Add action not implemented');
              break;
            }
          break;
          default:
            alert('Action not implemented');
          break;
        }
      }
    }

  });

  return ProjectOverviewMenu;

});