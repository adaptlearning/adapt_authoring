// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');
  var SidebarFieldsetFilterView = require('coreJS/sidebar/views/sidebarFieldsetFilterView');
  var Backbone = require('backbone');
  var Helpers = require('coreJS/app/helpers');

  var SidebarItemView = OriginView.extend({
    className: 'sidebar-item',

    events: {
      'click button.editor-common-sidebar-project': 'editProject',
      'click button.editor-common-sidebar-config': 'editConfiguration',
      'click button.editor-common-sidebar-extensions': 'manageExtensions',
      'click button.editor-common-sidebar-menusettings': 'editMenu',
      'click button.editor-common-sidebar-select-theme': 'selectTheme',
      'click button.editor-common-sidebar-download': 'downloadProject',
      'click button.editor-common-sidebar-preview': 'previewProject',
      'click button.editor-common-sidebar-export': 'exportProject',
      'click button.editor-common-sidebar-close': 'closeProject'
    },

    initialize: function(options) {
      this.listenTo(Origin, {
        'sidebar:resetButtons': this.resetButtons,
        'sidebar:views:animateIn': this.animateViewIn,
        'editorSidebar:showErrors': this.onShowErrors
      });

      if(options && options.form) {
        this.form = options.form;
      }
      this.render();
    },

    postRender: function() {
      if(this.form) {
        this.setUpFieldsetFilters();
      }
      this.listenTo(Origin, 'sidebar:views:remove', this.remove);
    },

    setUpFieldsetFilters: function() {
      var fieldsets = this.form.options.fieldsets;
      if (fieldsets.length > 0) {
        // TODO localise this
        this.$('.sidebar-item-inner').append(Handlebars.templates['sidebarDivide']({ title: 'Filters' }));
      }
      _.each(fieldsets, this.renderFieldsetFilter, this);
    },

    renderFieldsetFilter: function(fieldset) {
      var view = new SidebarFieldsetFilterView({ model: new Backbone.Model(fieldset) });
      this.$('.sidebar-item-inner').append(view.$el);
    },

    animateViewIn: function() {
      this.$el.velocity({ 'left': '0%', 'opacity': 1 }, "easeOutQuad");
    },

    updateButton: function(buttonClass, updateText) {
      this.$(buttonClass)
        .append(Handlebars.templates['sidebarUpdateButton']({ updateText: updateText }))
        .addClass('sidebar-updating')
        .attr('disabled', true)
        .find('span').eq(0).addClass('display-none');
    },

    resetButtons: function() {
      var $sidebarUpdating = this.$('.sidebar-updating');

      $sidebarUpdating
        .removeClass('sidebar-updating')
        .attr('disabled', false);

      var $spans = $sidebarUpdating.find('span');
      $spans.eq(0).removeClass('display-none');
      $spans.eq(1).remove();
    },

    navigateToEditorPage: function(page) {
      Origin.router.navigate('#/editor/' + Origin.editor.data.course.get('_id') + '/' + page, { trigger: true });
    },

    /**
    * Event handling
    */

    onShowErrors: function(errors) {
      this.$('.sidebar-fieldset-filter').removeClass('error');
      if(!errors) {
        return;
      }
      this.resetButtons();
      // match error to sidebar fieldset filter, and show error styling
      _.each(errors, function(error, attribute) {
        _.each(this.form.options.fieldsets, function(fieldset, key) {
          if(_.contains(fieldset.fields, attribute)) {
            var className = Helpers.stringToClassName(fieldset.legend);
            this.$('.sidebar-fieldset-filter-' + className).addClass('error');
          }
        }, this);
      }, this);
    },

    editProject: function() {
      this.navigateToEditorPage('settings');
    },

    editConfiguration: function() {
      this.navigateToEditorPage('config');
    },

    selectTheme: function() {
      this.navigateToEditorPage('selecttheme');
    },

    editMenu: function() {
      this.navigateToEditorPage('menusettings');
    },

    manageExtensions: function() {
      this.navigateToEditorPage('extensions');
    },

    downloadProject: function() {
      Origin.trigger('editorCommon:download');
    },

    previewProject: function() {
      Origin.trigger('editorCommon:preview');
    },

    exportProject: function() {
      Origin.trigger('editorCommon:export');
    },

    closeProject: function() {
      Origin.router.navigate('#/dashboard');
    }
  });

  return SidebarItemView;
});
