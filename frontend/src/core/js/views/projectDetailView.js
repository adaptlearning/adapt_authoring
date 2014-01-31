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
      'blur #projectDetail input': 'inputBlur',
      'click #projectDetail button': 'buttonClick'
    },

    render: function() {
      var template = Handlebars.templates.projectDetail,
          projectview = this;
      if(! projectview.model.id ){
        //@todo Is this the best point to handle new entry?
        projectview.$el.html( template( projectview.model.toJSON() ) );
      } else {
        //not great but the fetch can take a while http://stackoverflow.com/questions/9250523/how-to-wait-to-render-view-in-backbone-js-until-fetch-is-complete
        this.model.fetch().complete(function(){
          //@todo once connected up remove
          projectview.$el.html(template(projectview.model.toJSON()));
        });

      }
      return this;
    },

    inputBlur: function (ev) {
      //@todo add the validation logic
    },

    buttonClick: function (ev) {
      var $el = $(ev.currentTarget),
          projectview = this;

      ev.preventDefault();

      switch( $el.attr('id') ){
          case 'projectDetailSubmit':
            //@todo do the save
              projectview.model.save({
                name: projectview.$('#projectDetailTitle').val(),
                description: projectview.$('#projectDetailDescription').val()
              },{
                error:function(){
                  alert('An error occurred doing the save');
                },
                success: function() {
                  alert('Saved Successfully');
                  Backbone.history.navigate('/dashboard', {trigger: true});
                }
              });
          break;
      }
    }
  });

  return ProjectDetailView;

});