define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var OriginView = require('coreJS/app/views/originView');
  var Origin = require('coreJS/app/origin');

  var ProjectView = OriginView.extend({

    tagName: 'li',

    className: 'project-list-item',

    events: {
      'click a.open-context-course' : 'openContextMenu'
    },

    preRender: function() {
      this.listenTo(this, 'remove', this.remove);
      this.listenTo(this.model, 'destroy', this.remove);

      this.on('contextMenu:course:edit', this.editProject);
      this.on('contextMenu:course:editproperties', this.editProperties);
      this.on('contextMenu:course:delete', this.deleteProject);
      this.on('contextMenu:course:duplicate', this.duplicateProject);
    },

    openContextMenu: function (e) {
      e.stopPropagation();
      e.preventDefault();

      Origin.trigger('contextMenu:open', this, e);
    },

    editProject: function(event) {
      if (event) {
        event.preventDefault();  
      }
      
      Backbone.history.navigate('/editor/' + this.model.get('_id') + '/menu', {trigger: true});
    },

    editProperties: function(event) {
      if (event) {
        event.preventDefault();
      }

      Backbone.history.navigate('/project/edit/' + this.model.get('_id'), {trigger: true});
    },

    deleteProject: function(event) {
      event && event.preventDefault();
      
      if (confirm(window.polyglot.t('app.confirmdeleteproject'))) {
        this.model.destroy();
      }
    },

    duplicateProject: function() {
      alert('TODO');
    }
    
  }, {
    template: 'project'
  });

  return ProjectView;

});