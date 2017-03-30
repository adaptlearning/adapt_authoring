// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var _ = require('underscore');
  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var OriginView = require('core/views/originView');
  var Origin = require('core/origin');

  var ProjectView = OriginView.extend({
    className: 'project-list-item',
    tagName: 'li',

    events: {
      'dblclick': 'editProject',
      'click': 'selectProject',
      'click a.open-context-course': 'openContextMenu',
      'click a.course-delete': 'deleteProjectPrompt',
      'click .projects-details-tags-button-show': 'onProjectShowTagsButtonClicked',
      'click .projects-details-tags-button-hide': 'onProjectHideTagsButtonClicked',
    },

    preRender: function() {
      this.listenTo(this, 'remove', this.remove);

      this.listenTo(Origin, {
        'dashboard:dashboardView:removeSubViews': this.remove,
        'dashboard:projectView:itemSelected': this.deselectItem,
        'dashboard:dashboardView:deselectItem': this.deselectItem
      });
      this.listenTo(Origin, 'editorView:deleteProject:' + this.model.get('_id'), this.deleteProject);

      this.on('contextMenu:course:editSettings', this.editProjectSettings);
      this.on('contextMenu:course:edit', this.editProject);
      this.on('contextMenu:course:delete', this.deleteProjectPrompt);
      this.on('contextMenu:course:duplicate', this.duplicateProject);

      this.model.set('heroImageURI', this.model.getHeroImageURI());
    },

    openContextMenu: function(event) {
      if(event) {
        event.stopPropagation();
        event.preventDefault();
      }
      Origin.trigger('contextMenu:open', this, event);
    },

    editProjectSettings: function(event) {
      event && event.preventDefault();
      Origin.router.navigateTo('editor/' + this.model.get('_id') + '/settings');
    },

    editProject: function(event) {
      event && event.preventDefault();
      Origin.router.navigateTo('editor/' + this.model.get('_id') + '/menu');
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

    deleteProjectPrompt: function(event) {
      event && event.preventDefault();
      if(this.model.get('_isShared') === true) {
        Origin.Notify.confirm({
          type: 'warning',
          title: Origin.l10n.t('app.deletesharedproject'),
          text: Origin.l10n.t('app.confirmdeleteproject') + '<br/><br/>' + Origin.l10n.t('app.confirmdeletesharedprojectwarning'),
          destructive: true,
          callback: _.bind(this.deleteProjectConfirm, this)
        });
        return;
      }
      Origin.Notify.confirm({
        type: 'warning',
        title: Origin.l10n.t('app.deleteproject'),
        text: Origin.l10n.t('app.confirmdeleteproject') + '<br/><br/>' + Origin.l10n.t('app.confirmdeleteprojectwarning'),
        callback: _.bind(this.deleteProjectConfirm, this)
      });
    },

    deleteProjectConfirm: function(confirmed) {
      if (confirmed) {
        var id = this.model.get('_id');
        Origin.trigger('editorView:deleteProject:' + id);
      }
    },

    deleteProject: function(event) {
      this.model.destroy({
        success: _.bind(this.remove, this),
        error: function(model, response, options) {
          _.delay(function() {
            Origin.Notify.alert({ type: 'error', text: response.responseJSON.message });
          }, 1000);
        }
      });
    },

    duplicateProject: function() {
      $.ajax({
        url: this.model.getDuplicateURI(),
        success: function (data) {
          Origin.router.navigateTo('editor/' + data.newCourseId + '/settings');
        },
        error: function() {
          Origin.Notify.alert({ type: 'error', text: Origin.l10n.t('app.errorduplication') });
        }
      });
    },

    onProjectShowTagsButtonClicked: function(event) {
      if(event) {
        event.preventDefault();
        event.stopPropagation();
      }
      this.$('.tag-container').show().velocity({ opacity: 1 });
    },

    onProjectHideTagsButtonClicked: function(event) {
      if(event) {
        event.preventDefault();
        event.stopPropagation();
      }
      this.$('.tag-container').velocity({ opacity: 0 }).hide();
    }
  }, {
    template: 'project'
  });

  return ProjectView;
});
