// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');
  var SidebarBreadcrumbView = require('./sidebarBreadcrumbView');
  var SidebarActionButtonView = require('./sidebarActionButtonView');
  var SidebarLinkButtonView = require('./sidebarLinkButtonView');
  var SidebarFilterView = require('./sidebarFilterView');
  var SidebarFieldsetFilterView = require('./sidebarFieldsetFilterView');

  var Sidebar = OriginView.extend({
    className: 'sidebar',

    initialize: function(options) {
      this.resetModel();

      this.listenTo(Origin, {
        'sidebar:hide': this.hide,
        'sidebar:actionButton:add': this.renderActionButton,
        'sidebar:linkButton:add': this.renderLinkButton,
        'sidebar:widget:add': this.renderWidget,
        // 'sidebar:sidebarFilter:add': this.renderFilterView,
        'editorSidebar:showErrors': this.showErrors
      });
      OriginView.prototype.initialize.apply(this, arguments);
    },

    resetModel: function(data) {
      data = data || {};
      this.model = new Backbone.Model({
        actionButtons: data.actionButtons || [],
        linkButtons: data.linkButtons || [],
        customButtons: data.customButtons || [],
        fieldsets: data.fieldsets || [],
        widgets: data.widgets || []
      });
    },

    update: function(options) {
      this.resetModel(options);
      if(options && options.breadcrumb) {
        this.renderBreadcrumb(options.breadcrumb);
      } else {
        this.hideEl(this.$('.sidebar-breadcrumb'));
      }
      this.render();
    },

    show: function() {
      $('html').removeClass('sidebar-hide');
      this.$('.group').velocity({ 'left': '0%', 'opacity': 1 }, 'easeOutQuad');
    },

    hide: function() {
      $('html').addClass('sidebar-hide');
      this.$('.group').velocity({ 'left': '10%', 'opacity': 0 }, 'easeOutQuad');
    },

    postRender: function() {
      this.renderGroups();
      this.show();
    },

    renderBreadcrumb: function(data) {
      console.log('renderBreadcrumb:', data);
      setTimeout(function() {
        var view = new SidebarBreadcrumbView(data);
        var $el = this.$('.sidebar-breadcrumb');
        $el.html(view.$el);
        this.showEl($el);
      }.bind(this), 1);
    },

    renderGroups: function() {
      var groups = [
        { name: 'actionButtons', func: this.renderActionButton },
        { name: 'linkButtons', func: this.renderLinkButton },
        { name: 'fieldsets', func: this.renderFieldsetFilter },
        { name: 'widgets', func: this.renderWidget },
      ];
      groups.forEach(function(group) {
        var items = this.model.get(group.name);
        if(items && items.length) items.forEach(group.func, this);
      }.bind(this));
    },

    renderActionButton: function(data, index) {
      this.attachHTML(new SidebarActionButtonView(data).$el, this.$('.action-button-container'), index);
    },

    renderLinkButton: function(data, index) {
      this.attachHTML(new SidebarLinkButtonView(data).$el, this.$('.link-button-container'), index);
    },

    renderFieldsetFilter: function(data) {
      var view = new SidebarFieldsetFilterView({ model: new Backbone.Model(data.schema) });
      this.attachHTML(view.$el, this.$('.fieldset-container'));
    },

    renderWidget: function($el, index) {
      this.attachHTML($el, this.$('.widget-container'));
    },


    /*
    renderFilterView: function(options) {
      Origin.trigger('sidebar:sidebarFilter:remove');
      $('body').append(new SidebarFilterView(options).$el);
    },
    */

    /**
    * A number of assumptions are made here:
    * - $el is a valid jQuery object
    * - $container is a direct parent of the children to be used for ordering
    * - index value is zero-indexed
    */
    attachHTML: function($el, $container, index) {
      var children = $container.children();
      // deal with unexpected values by just appending
      if(children.length === 0 || index === undefined || index < 0 || index > children.length-1) {
        return $container.append($el);
      }
      children[index].after($el);
    },

    showEl: function($el) {
      $el.addClass('show');
    },

    hideEl: function($el) {
      $el.removeClass('show');
    },

    showErrors: function(errors) {
      this.$('.sidebar-fieldset-filter').removeClass('error');

      if (!errors) return;

      // add a visual cue for any fieldsets with errors
      _.each(errors, function(error, attribute) {
        _.each(this.form.options.fieldsets, function(fieldset, key) {
          if(!_.contains(fieldset.fields, attribute)) return;
          this.$('.sidebar-fieldset-filter-' + fieldset.key).addClass('error');
        }, this);
      }, this);
    },
  }, {
    template: 'sidebar'
  });

  return Sidebar;
});
