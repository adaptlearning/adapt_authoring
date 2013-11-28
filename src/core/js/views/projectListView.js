define(["backbone", "handlebars", "coreViews/projectView"], function(Backbone, Handlebars, ProjectView){

  var ProjectListView = Backbone.View.extend({
    
    tagName: 'div',
    
    class: 'row',
    
    initialize: function(){
        this.listenTo(this.collection, 'reset', this.render);
    },
    
    render: function() {
      this.collection.forEach(this.addOne, this);
      return this;
    },
    
    addOne: function(project) {
      var projectView = new ProjectView({model:project});
      this.$el.append(projectView.render().el);
    }
    
  });
  
  return ProjectListView;
  
});