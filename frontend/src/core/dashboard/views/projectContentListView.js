define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var ProjectContentView = require('coreJS/dashboard/views/projectContentView');

  var ProjectContentListView = Backbone.View.extend({

    initialize: function(){
      this.listenTo(this.collection, 'reset', this.render);
      this.listenTo(this.collection, 'add', this.addOne);
    },

    render: function() {
      if( this.collection.length === 0 ) {
        this.$el.html('<p>No Content</p>'); //@todo remove text from code
      } else {
        this.$el.html(''); //@todo sort this out so that "No Courses" isn't printed then appended to
        this.collection.forEach(this.addOne, this);
      }
      return this;
    },

    addOne: function(projectContent) {
      var projectContentView = new ProjectContentView({model:projectContent});
      this.$el.append(projectContentView.render().el);
    },
  });

  return ProjectContentListView
});