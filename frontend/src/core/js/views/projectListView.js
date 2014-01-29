define(["backbone", "handlebars", "coreViews/projectView"], function(Backbone, Handlebars, ProjectView){

  var ProjectListView = Backbone.View.extend({

    tagName: 'div',

    class: 'row',

    events : {
      'click .project' : 'gotoProject'
    },

    initialize: function(){
      this.listenTo(this.collection, 'reset', this.render);
      this.listenTo(this.collection, 'add', this.addOne);
    },

    render: function() {
      this.collection.forEach(this.addOne, this);
      return this;
    },

    addOne: function(project) {
      var projectView = new ProjectView({model:project});
      this.$el.append(projectView.render().el);
    },

    gotoProject: function (ev) {
      var projectid = $(ev.currentTarget).data('projectid');

      ev.preventDefault();

      Backbone.history.navigate('/project/' + projectid, {trigger: true});
    }

  });

  return ProjectListView;

});