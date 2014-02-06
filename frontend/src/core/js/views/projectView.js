//@TODO course|project
define(["backbone", "handlebars"], function(Backbone, Handlebars){

  var ProjectView = Backbone.View.extend({

    initialize: function() {
      this.render();
    },

    tagName: "div",

    className: "project col-6 col-sm-4 col-lg-2",

/*    attributes: function () {
      return {
        'data-projectid': this.model.get('_id')
      };
    },*/

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