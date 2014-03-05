define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var OriginView = require('coreJS/app/views/originView');
  var Origin = require('coreJS/app/origin');

  var ProjectView = OriginView.extend({

    tagName: 'div',

    className: 'project',

    events: {
      'click .project-delete-link' : 'deleteProject',
      'click .project-add-page'    : 'addPage'
    },

    deleteProject: function(event) {
      event.preventDefault();
      if (confirm('Are you sure you want to delete this project?')) {
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