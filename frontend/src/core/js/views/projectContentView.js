//@TODO course|project
define(["backbone", "handlebars"], function(Backbone, Handlebars){

  var ProjectContentView = Backbone.View.extend({

    tagName: "div",

    className: "project col-6 col-sm-4 col-lg-2",

    attributes: function () {
      return {
        'data-contentid': this.model.get('_id'),
        'data-type': this.model.get('type')
      };
    },

    render: function() {

      var template = Handlebars.templates.projectContent;
      this.$el.html(template(this.model.toJSON()));
      return this;
    }

  });

  return ProjectContentView;

});