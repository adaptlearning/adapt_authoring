//@TODO course|project
define(["backbone", "handlebars"], function(Backbone, Handlebars){

  var ProjectView = Backbone.View.extend({

    tagName: "div",

    className: "project col-6 col-sm-4 col-lg-2",

    attributes: function () {
      return {
        'data-projectid': this.model.get('_id')
      };
    },

    render: function() {

      var template = Handlebars.templates.project;
      this.$el.html(template(this.model.toJSON()));
      return this;
    }

  });

  return ProjectView;

});