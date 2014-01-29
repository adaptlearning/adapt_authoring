define(function(require) {
  var Backbone = require('backbone'),
      Handlebars = require('handlebars'),
      $ = require('jquery'),
      AdaptBuilder = require('coreJS/adaptbuilder');

var ProjectDetailView = Backbone.View.extend({

    initialize: function() { },

    tagName: "div",

    className: "project",

    events: {
      'blur input': 'inputBlur',
      'click button': 'buttonClick'
    },

    render: function() {
      var template = Handlebars.templates.projectDetail,
          projectview = this;

      //not great but the fetch can take a while http://stackoverflow.com/questions/9250523/how-to-wait-to-render-view-in-backbone-js-until-fetch-is-complete
      this.model.fetch().complete(function(){
        //@todo once connected up remove
        projectview.$el.html(template({title:'Test Project'}));
        //projectview.$el.html(template(projectview.model.toJSON()));
      });

      return this;
    },

  });

  return ProjectDetailView;

});