//@TODO course|project
define(["backbone", "handlebars", "coreViews/projectView"], function(Backbone, Handlebars, ProjectView){

  var ProjectListView = Backbone.View.extend({

    tagName: 'div',

    class: 'row',

    events : {
      'click .project' : 'gotoProject',
      'click .project .editlink' : 'editProject'
    },

    initialize: function(){
      this.listenTo(this.collection, 'reset', this.render);
      this.listenTo(this.collection, 'add', this.addOne);
    },

    render: function() {
      if( this.collection.length === 0 ) {
        this.$el.html('<p>No Courses</p>'); //@todo remove text from code
      } else {
        this.$el.html(''); //@todo sort this out so that No Courses isn't printed
        this.collection.forEach(this.addOne, this);
      }
      return this;
    },

    addOne: function(project) {
      var projectView = new ProjectView({model:project});
      this.$el.append(projectView.render().el);
    },

    gotoProject: function (ev) {
      var $el = $(ev.target);
      if( ! $el.hasClass('project') ) {
        $el = $el.closest('.project');
      }
      var projectid = $el.data('projectid');

      ev.preventDefault();

      Backbone.history.navigate('/project/view/' + projectid, {trigger: true});
    },

    editProject: function (ev) {
      var $el = $(ev.target);
      if( ! $el.hasClass('project') ) {
        $el = $el.closest('.project');
      }
      var projectid = $el.data('projectid');

      ev.preventDefault();
      ev.stopPropagation();

      Backbone.history.navigate('/project/edit/' + projectid, {trigger: true});
    }
  });

  return ProjectListView;

});