define(function(require) {
  var Backbone = require('backbone'),
      Handlebars = require('handlebars'),
      $ = require('jquery'),
      AdaptBuilder = require('coreJS/adaptbuilder');

var ProjectOverview = Backbone.View.extend({

    initialize: function() { },

    tagName: "div",

    className: "project-overview",

    events: {
      /*'blur #projectDetail input': 'inputBlur',
      'click #projectDetail button': 'buttonClick'*/
    },

    render: function() {
      var template = Handlebars.templates.projectOverview,
          projectOverview = this;

      //not great but the fetch can take a while http://stackoverflow.com/questions/9250523/how-to-wait-to-render-view-in-backbone-js-until-fetch-is-complete
      projectOverview.model.fetch().complete(function(){

        projectOverview.$el.html(template( projectOverview.model.toJSON() ));
        projectOverview.trigger('rendered');

      });

      return this;
    },

    inputBlur: function (ev) {
      //@todo add the validation logic
    },

    buttonClick: function (ev) {
      var $el = $(ev.currentTarget),
          projectOverview = this;

      ev.preventDefault();

      switch( $el.attr('id') ){
      }
    }
  });

  return ProjectOverview;

});