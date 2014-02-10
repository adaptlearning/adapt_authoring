define(function(require){

  var Backbone = require('backbone');
  var BuilderView = require('coreJS/core/views/builderView');

  var ProjectView = BuilderView.extend({

    tagName: "div",

    className: "project col-6 col-sm-4 col-lg-2",

    events: {
      "click a.delete-link" : "deleteProject"
    },

    deleteProject: function(event) {
      event.preventDefault();

      if (confirm('Are you sure you want to delete this project')) {
        if (this.model.destroy()) {
          this.remove();       
        }
      }
    }
  });

  return ProjectView;

});