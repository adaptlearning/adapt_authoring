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
      this.listenTo(Origin, 'editorView:deleteProject:' + this.model.get('_id'), this.deleteProject);

      this.on('contextMenu:course:edit', this.editProject);
      this.on('contextMenu:course:delete', this.deleteProjectPrompt);
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

    deleteProjectPrompt: function(event) {
      if (event) {
        event.preventDefault();
      }
      var id = this.model.get('_id');
      var deleteProject = {
          _type: 'prompt',
          _showIcon: true,
          title: window.polyglot.t('app.deleteproject'),
          body: window.polyglot.t('app.confirmdeleteproject') + '<br />' + '<br />' + window.polyglot.t('app.confirmdeleteprojectwarning'),
          _prompts: [
            {_callbackEvent: 'editorView:deleteProject:' + id, promptText: window.polyglot.t('app.ok')},
            {_callbackEvent: '', promptText: window.polyglot.t('app.cancel')}
          ]
        };

      Origin.trigger('notify:prompt', deleteProject);
    },

    deleteProject: function(event) {
      if (this.model.destroy()) {
          this.remove();
        }
    },

    duplicateProject: function() {
      $.ajax({
        url:'/api/duplicatecourse/' + this.model.get('_id'),
        success: function (data) {
          Backbone.history.navigate('/project/edit/' + data.newCourseId, {trigger: true});
        },
        error: function() {
          alert('error during duplication');
        }
      });
    }
    
  }, {
    template: 'project'
  });

  return ProjectView;

});