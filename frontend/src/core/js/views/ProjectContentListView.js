define(["backbone", "handlebars"], function(Backbone, Handlebars){

  var ProjectListView = Backbone.View.extend({

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
  });

});