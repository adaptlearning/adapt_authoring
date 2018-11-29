// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Helpers = require('core/helpers');
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');
  var SidebarFieldsetFilterView = require('./sidebarFieldsetFilterView');

  var SidebarItemView = OriginView.extend({
    className: 'sidebar-item',

    events: {
      'click button.editor-common-sidebar-project': 'editProject',
      'click button.editor-common-sidebar-config': 'editConfiguration',
      'click button.editor-common-sidebar-extensions': 'manageExtensions',
      'click button.editor-common-sidebar-menusettings': 'editMenu',
      'click button.editor-common-sidebar-select-theme': 'selectTheme',
      'click button.editor-common-sidebar-close': 'closeProject'
    },

    initialize: function(options) {
      if (options && options.form) { // Set form on view
        this.form = options.form;
      }
      this.render();
      this.listenTo(Origin, {
        'sidebar:resetButtons': this.resetButtons,
        'sidebar:views:animateIn': this.animateViewIn
      });
      _.defer(_.bind(function() {
        this.listenTo(Origin, 'sidebar:views:remove', this.remove);

        if(!this.form) return;

        this.setupFieldsetFilters();
        this.listenTo(Origin, 'editorSidebar:showErrors', this.onShowErrors);
      }, this));
    },

    setupFieldsetFilters: function() {
      var fieldsets = this.form.options.fieldsets;
      if (fieldsets.length > 0) {
        this.$('.sidebar-item-inner').append(Handlebars.templates['sidebarDivide']({ title: 'Filters' }));
      }
      _.each(fieldsets, function(fieldset) {
        this.$('.sidebar-item-inner').append(new SidebarFieldsetFilterView({ model: new Backbone.Model(fieldset) }).$el);
      }, this);
    },

    onShowErrors: function(errors) {
      this.$('.sidebar-fieldset-filter').removeClass('error');

      if (!errors) return;

      this.resetButtons();
      // add a visual cue for any fieldsets with errors
      _.each(errors, function(error, attribute) {
        _.each(this.form.options.fieldsets, function(fieldset, key) {
          if(!_.contains(fieldset.fields, attribute)) return;
          // Convert fieldsets legend value to class name
          var className = Helpers.stringToClassName(fieldset.legend);
          // Set error message
          this.$('.sidebar-fieldset-filter-' + className).addClass('error');
        }, this);
      }, this);
    },

    updateButton: function(buttonClass, updateText) {
      this.$(buttonClass)
        .append(Handlebars.templates['sidebarUpdateButton']({ updateText: updateText }))
        .addClass('sidebar-updating')
        .attr('disabled', true)
        .find('span').eq(0).addClass('display-none');
    },

    resetButtons: function() {
      var $buttonsSpans = this.$('.sidebar-updating').removeClass('sidebar-updating').attr('disabled', false).find('span');
      $buttonsSpans.eq(0).removeClass('display-none');
      $buttonsSpans.eq(1).remove();
    },

    animateViewIn: function() {
      this.$el.velocity({ 'left': '0%', 'opacity': 1 }, "easeOutQuad");
    },

    navigateToEditorPage: function(page) {
      Origin.router.navigateTo('editor/' + Origin.editor.data.course.get('_id') + '/' + page);
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

    closeProject: function() {
      Origin.router.navigateTo('dashboard');
    }
  });

  return SidebarItemView;
});
