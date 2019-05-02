// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');
  var SidebarFieldsetFilterView = require('./sidebarFieldsetFilterView');
  var Backbone = require('backbone');
  var Helpers = require('core/helpers');

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
      'click button.editor-common-sidebar-preview-force': 'forcePreviewProject',
      'click button.editor-common-sidebar-export': 'exportProject',
      'click button.editor-common-sidebar-close': 'closeProject',
      'click .editor-common-sidebar-preview-wrapper .dropdown button': 'toggleDropdown'
    },

    initialize: function(options) {

        // Set form on view
        if (options && options.form) {
          this.form = options.form;
        }
        this.render();
        this.listenTo(Origin, 'sidebar:resetButtons', this.resetButtons);
        this.listenTo(Origin, 'sidebar:views:animateIn', this.animateViewIn);
        _.defer(_.bind(function() {
            this.setupView();
            if (this.form) {
              this.setupFieldsetFilters();
              this.listenTo(Origin, 'editorSidebar:showErrors', this.onShowErrors);
            }
        }, this));
    },

    postRender: function() {
      this._onWindowClick = this.onWindowClick.bind(this);
      this.$dropdown = this.$('.dropdown');
      $(window).on('click', this._onWindowClick);
    },

    setupView: function() {
        this.listenTo(Origin, 'sidebar:views:remove', this.remove);
    },

    setupFieldsetFilters: function() {
      var fieldsets = this.form.options.fieldsets;
      if (fieldsets.length > 0) {
        this.$('.sidebar-item-inner').append(Handlebars.templates['sidebarDivide']({title: 'Filters'}));
      }
      _.each(fieldsets, function(fieldset) {
        this.$('.sidebar-item-inner').append(new SidebarFieldsetFilterView({model: new Backbone.Model(fieldset)}).$el);
      }, this);
    },

    onShowErrors: function(errors) {
      this.$('.sidebar-fieldset-filter').removeClass('error');

      if (errors) {
        // If there's error we should reset the save button
        this.resetButtons();
        // Go through each error and see where this error fits in the fieldsets
        // this way we can notify the user something is invalid on the sidebar filters
        _.each(errors, function(error, attribute) {
          _.each(this.form.options.fieldsets, function(fieldset, key) {
            //var fieldKeys = _.keys(fieldset.fields);
            if (_.contains(fieldset.fields, attribute)) {
              // Convert fieldsets legend value to class name
              var className = Helpers.stringToClassName(fieldset.legend);
              // Set error message
              this.$('.sidebar-fieldset-filter-' + className).addClass('error');
            }
          }, this);
        }, this);
      }
    },

    updateButton: function(buttonClass, updateText) {
      this.$(buttonClass)
        .append(Handlebars.templates['sidebarUpdateButton']({updateText: updateText}))
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
        this.$el.velocity({'left': '0%', 'opacity': 1}, "easeOutQuad");
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

    downloadProject: function() {
      Origin.trigger('editorCommon:download');
    },

    previewProject: function() {
      Origin.trigger('editorCommon:preview', false);
    },

    forcePreviewProject: function() {
      Origin.trigger('editorCommon:preview', true);
    },

    exportProject: function() {
      Origin.trigger('editorCommon:export');
    },

    closeProject: function() {
      Origin.router.navigateTo('dashboard');
    },

    toggleDropdown: function(event) {
      event.stopPropagation();
      this.$dropdown.toggleClass('active');
    },

    onWindowClick: function() {
      this.$dropdown.removeClass('active');
    },

    remove: function() {
      $(window).off('click', this._onWindowClick);
      OriginView.prototype.remove.apply(this, arguments);
    }

  });

  return SidebarItemView;

})
