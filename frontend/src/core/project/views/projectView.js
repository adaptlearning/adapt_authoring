define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var OriginView = require('coreJS/app/views/originView');
  var Origin = require('coreJS/app/origin');
  var EditorModel = require('coreJS/editor/models/editorModel');

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
    },

    //TEMPORARY ADD PAGE FUNCTION
    addPage: function(event) {
      event.preventDefault();
      var newPage = new EditorModel({urlRoot: '/api/content/contentObject'});

      newPage.save({
        _parentId: this.model.get('_id'),
        title: 'test',
        body: 'test',
        linkText: 'test',
        graphic: {
          alt: 'test',
          src: 'test'
        },
        _type: 'page',
        tenantId: 'noidyet'},
        {
          error: function() {
            alert('An error occurred doing the save');
          },
          success: function() {
            console.log(newPage);
            Backbone.history.navigate('#editor/page/' + newPage.get('_id'), {trigger: true});
          }
        }
      );
    }
    
  }, {
    template: 'project'
  });

  return ProjectView;

});