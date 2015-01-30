define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var OriginView = require('coreJS/app/views/originView');
  var Origin = require('coreJS/app/origin');

  var SharedProjectView = OriginView.extend({

    tagName: 'li',

    className: 'shared-project-list-item',

    events: {
      'dblclick'                        : 'promptDuplicateProject',
      'click'                           : 'selectProject',
      'click a.open-context-course'     : 'openContextMenu'
    },

    preRender: function() {
      this.listenTo(this, 'remove', this.remove);
      this.listenTo(this.model, 'destroy', this.remove);
      this.listenTo(Origin, 'editorView:deleteProject:' + this.model.get('_id'), this.deleteProject);
      this.listenTo(Origin, 'dashboard:projectView:itemSelected', this.deselectItem);
      this.listenTo(Origin, 'dashboard:dashboardView:deselectItem', this.deselectItem);

      this.on('contextMenu:sharedcourse:duplicate', this.promptDuplicateProject);
      this.on('contextMenu:sharedcourse:preview', this.preview);
    },

    openContextMenu: function (e) {
      e.stopPropagation();
      e.preventDefault();

      Origin.trigger('contextMenu:open', this, e);
    },

    selectProject: function(event) {
      event.stopPropagation();
      this.selectItem();
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

    preview: function() {
      alert('Preview coming soon!');
    },

    promptDuplicateProject: function() {
      if (confirm("This course was shared by another user.  Would you like to duplicate this so you can edit it locally?")) {
        this.duplicateProject();
      }
    },

    duplicateProject: function() {
      $.ajax({
        url: this.model.getDuplicateURI(),
        type: 'GET',
        success: function (data) {
          Backbone.history.navigate('/editor/' + data.newCourseId + '/settings', {trigger: true});
        },
        error: function() {
          alert('error during duplication');
        }
      });
    }
    
  }, {
    template: 'sharedProject'
  });

  return SharedProjectView;

});