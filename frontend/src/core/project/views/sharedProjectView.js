// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
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
      this.listenTo(Origin, 'editorView:deleteProject:' + this.model.get('_id'), this.deleteProject);
      this.listenTo(Origin, 'dashboard:projectView:itemSelected', this.deselectItem);
      this.listenTo(Origin, 'dashboard:dashboardView:deselectItem', this.deselectItem);

      this.on('contextMenu:sharedcourse:duplicate', this.promptDuplicateProject);
      this.on('contextMenu:sharedcourse:preview', this.preview);

      this.model.set('heroImageURI', this.model.getHeroImageURI());
    },

    openContextMenu: function (e) {
      e.stopPropagation();
      e.preventDefault();

      Origin.trigger('contextMenu:open', this, e);
    },

    selectProject: function(event) {
      event && event.preventDefault();

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
      var tenantId = this.model.get('_tenantId');
      var courseId = this.model.get('_id');

      window.open('/preview/' + tenantId + '/' + courseId + '/');
    },

    promptDuplicateProject: function() {
      var self = this;

      Origin.Notify.confirm({
        text: window.polyglot.t('app.confirmduplicate'),
        callback: function(confirmed) {
          if (confirmed) {
            self.duplicateProject();
          }
        }
      });
    },

    duplicateProject: function() {
      $.ajax({
        url: this.model.getDuplicateURI(),
        type: 'GET',
        success: function (data) {
          Origin.router.navigate('/editor/' + data.newCourseId + '/settings', {trigger: true});
        },
        error: function() {
          Origin.Notify.alert({
            type: 'error',
            text: window.polyglot.t('app.errorduplication')
          });
        }
      });
    }

  }, {
    template: 'sharedProject'
  });

  return SharedProjectView;

});
