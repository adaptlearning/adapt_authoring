define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var BuilderView = require('coreJS/app/views/builderView');
  var Builder = require('coreJS/app/adaptBuilder');

  var ProjectView = BuilderView.extend({

    tagName: 'div',

    className: 'project',

    events: {
      'click .project-delete-link' : 'deleteProject'
    },

    deleteProject: function(event) {
      event.preventDefault();
      if (confirm('Are you sure you want to delete this project')) {
        if (this.model.destroy()) {
          this.remove();       
        }
      }
    }
    
  }, {
    template: 'project'
  });

  return ProjectView;

});