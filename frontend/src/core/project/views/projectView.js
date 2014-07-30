define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var OriginView = require('coreJS/app/views/originView');
  var Origin = require('coreJS/app/origin');

  var ProjectView = OriginView.extend({

    tagName: 'li',

    className: 'project-list-item',

    events: {
      'dblclick': 'editProject',
      'click':'toggleSelectProject',
      'click a.open-context-course' : 'openContextMenu'
    },

    preRender: function() {
      this.listenTo(this, 'remove', this.remove);
      this.listenTo(this.model, 'destroy', this.remove);
      this.listenTo(Origin, 'editorView:deleteProject:' + this.model.get('_id'), this.deleteProject);
      this.listenTo(Origin, 'dashboard:projectView:itemSelected', this.deselectItem);
      this.listenTo(Origin, 'dashboard:dashboardView:deselectItem', this.deselectItem);

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

    toggleSelectProject: function() {
        event.stopPropagation();
      if (this.model.get('_isSelected')) {
        //this.deselectItem();
      } else {
        this.selectItem();
      } 
    },

    selectItem: function() {
      Origin.trigger('dashboard:projectView:itemSelected');
      this.$el.addClass('selected');
      this.model.set({_isSelected:true});
    },

    deselectItem: function() {
      this.$el.removeClass('selected');
      this.model.set({_isSelected:false});
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