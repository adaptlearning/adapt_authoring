//@TODO course|project
define(["backbone", "handlebars"], function(Backbone, Handlebars){

  var ProjectView = Backbone.View.extend({

    tagName: "div",

    className: "project col-6 col-sm-4 col-lg-2",

    events: {
      "click a.delete-link" : "deleteProject"
    },


    deleteProject: function(event) {
      event.preventDefault();
      // TODO
      return confirm('Are you sure you want to delete this project');
    },

    initialize: function() {
      this.render();
    },
    
    render: function() {
      var data = this.model.toJSON();
      console.log(data);
      var template = Handlebars.templates.project;
      this.$el.html(template(data));
      return this;
    }
  });

  return ProjectView;

});